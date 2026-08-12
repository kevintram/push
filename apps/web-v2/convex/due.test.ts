import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import type { Id } from './_generated/dataModel'
import * as Due from './model/due'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }

/*
 * `due` has no public wrapper yet, so these call the model through `t.run`
 * rather than through `api.*`. Point them at the public function once one
 * exists.
 */

type Harness = ReturnType<typeof convexTest>

async function seedTopic(t: Harness, ownerId: string): Promise<Id<'topics'>> {
	return await t.run(
		async ctx =>
			await ctx.db.insert('topics', {
				description: '',
				ownerId,
				title: 'Topic',
			}),
	)
}

async function seedCard(
	t: Harness,
	topicId: Id<'topics'>,
	ownerId: string,
	fields: { dueDate?: string; primaryText: string },
): Promise<Id<'reviewCards'>> {
	return await t.run(
		async ctx =>
			await ctx.db.insert('reviewCards', {
				notes: '',
				ownerId,
				secondaryText: '',
				state: 'LEARNING',
				topicId,
				type: 'flashcard',
				...fields,
			}),
	)
}

async function seedReview(
	t: Harness,
	reviewCardId: Id<'reviewCards'>,
	ownerId: string,
	fields: { date?: string; rating?: 'good' },
): Promise<void> {
	await t.run(async ctx => {
		await ctx.db.insert('reviews', {
			description: '',
			notes: '',
			ownerId,
			reviewCardId,
			...fields,
		})
	})
}

async function listEntries(
	t: Harness,
	userId: string,
	dueDate: string | Due.DueDateRange,
): Promise<Array<Due.DueEntry>> {
	return await t.run(
		async ctx => await Due.listByDueDate(ctx, userId, dueDate),
	)
}

/** The entries as `date` / `primaryText` pairs, for order-sensitive asserts. */
async function listByDueDate(
	t: Harness,
	userId: string,
	dueDate: string | Due.DueDateRange,
): Promise<Array<string>> {
	const entries = await listEntries(t, userId, dueDate)

	return entries.map(entry => `${entry.date} ${entry.card.primaryText}`)
}

describe('due.listByDueDate', () => {
	it('returns cards due on the date and cards with a review scheduled that day', async () => {
		const t = convexTest(schema, modules)
		const topicId = await seedTopic(t, userAIdentity.subject)
		await seedCard(t, topicId, userAIdentity.subject, {
			dueDate: '2026-08-10',
			primaryText: 'Due today',
		})
		const scheduledCardId = await seedCard(
			t,
			topicId,
			userAIdentity.subject,
			{ primaryText: 'Scheduled today' },
		)
		await seedCard(t, topicId, userAIdentity.subject, {
			dueDate: '2026-08-11',
			primaryText: 'Due tomorrow',
		})
		await seedReview(t, scheduledCardId, userAIdentity.subject, {
			date: '2026-08-10',
		})

		await expect(
			listByDueDate(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual([
			'2026-08-10 Scheduled today',
			'2026-08-10 Due today',
		])
	})

	it('excludes overdue cards and reviews from before the due date', async () => {
		const t = convexTest(schema, modules)
		const topicId = await seedTopic(t, userAIdentity.subject)
		await seedCard(t, topicId, userAIdentity.subject, {
			dueDate: '2026-08-08',
			primaryText: 'Overdue card',
		})
		const overdueReviewCardId = await seedCard(
			t,
			topicId,
			userAIdentity.subject,
			{ primaryText: 'Overdue review' },
		)
		await seedReview(t, overdueReviewCardId, userAIdentity.subject, {
			date: '2026-08-08',
		})

		await expect(
			listByDueDate(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual([])
	})

	it('returns a card once when it has several scheduled reviews that day', async () => {
		const t = convexTest(schema, modules)
		const topicId = await seedTopic(t, userAIdentity.subject)
		// No `dueDate`, so the card is only reachable through its reviews — the
		// path where an async dedupe check would push it twice.
		const cardId = await seedCard(t, topicId, userAIdentity.subject, {
			primaryText: 'Busy card',
		})
		await seedReview(t, cardId, userAIdentity.subject, {
			date: '2026-08-10',
		})
		await seedReview(t, cardId, userAIdentity.subject, {
			date: '2026-08-10',
		})

		await expect(
			listByDueDate(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual(['2026-08-10 Busy card'])
	})

	it('ignores completed reviews', async () => {
		const t = convexTest(schema, modules)
		const topicId = await seedTopic(t, userAIdentity.subject)
		await seedCard(t, topicId, userAIdentity.subject, {
			dueDate: '2026-08-10',
			primaryText: 'Due today',
		})
		const ratedCardId = await seedCard(t, topicId, userAIdentity.subject, {
			primaryText: 'Already reviewed',
		})
		await seedReview(t, ratedCardId, userAIdentity.subject, {
			date: '2026-08-10',
			rating: 'good',
		})

		await expect(
			listByDueDate(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual(['2026-08-10 Due today'])
	})

	it("never returns another user's cards", async () => {
		const t = convexTest(schema, modules)
		const topicId = await seedTopic(t, userBIdentity.subject)
		const cardId = await seedCard(t, topicId, userBIdentity.subject, {
			dueDate: '2026-08-10',
			primaryText: "User B's card",
		})
		await seedReview(t, cardId, userBIdentity.subject, {
			date: '2026-08-10',
		})

		await expect(
			listByDueDate(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual([])
	})

	it('rejects malformed dates', async () => {
		const t = convexTest(schema, modules)

		await expect(
			listByDueDate(t, userAIdentity.subject, '2026-8-10'),
		).rejects.toThrow('Invalid date-only value')
	})

	it('rejects malformed and inverted ranges', async () => {
		const t = convexTest(schema, modules)

		await expect(
			listByDueDate(t, userAIdentity.subject, {
				from: '2026-8-10',
				to: '2026-08-12',
			}),
		).rejects.toThrow('Invalid date-only value')

		await expect(
			listByDueDate(t, userAIdentity.subject, {
				from: '2026-08-12',
				to: '2026-08-10',
			}),
		).rejects.toThrow('Invalid date range')
	})

	describe('entry fields', () => {
		it('flags SRS-due cards and carries their uncompleted reviews', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)
			const cardId = await seedCard(t, topicId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'Due today',
			})
			await seedReview(t, cardId, userAIdentity.subject, {
				date: '2026-08-10',
			})

			const [entry, ...rest] = await listEntries(
				t,
				userAIdentity.subject,
				'2026-08-10',
			)

			expect(rest).toEqual([])
			expect(entry?.date).toBe('2026-08-10')
			expect(entry?.srsScheduled).toBe(true)
			expect(entry?.scheduledReviews).toHaveLength(1)
			expect(entry?.scheduledReviews[0]?.reviewCardId).toBe(cardId)
		})

		it('gives an SRS-due card with no review row an empty review list', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)
			await seedCard(t, topicId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'Due today',
			})

			const [entry] = await listEntries(
				t,
				userAIdentity.subject,
				'2026-08-10',
			)

			expect(entry?.srsScheduled).toBe(true)
			expect(entry?.scheduledReviews).toEqual([])
		})

		it('leaves `srsScheduled` false for a hand-scheduled review', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)
			// Due on another day, so this entry exists only via its review.
			const cardId = await seedCard(t, topicId, userAIdentity.subject, {
				dueDate: '2026-09-01',
				primaryText: 'Hand-scheduled',
			})
			await seedReview(t, cardId, userAIdentity.subject, {
				date: '2026-08-10',
			})

			const [entry] = await listEntries(
				t,
				userAIdentity.subject,
				'2026-08-10',
			)

			expect(entry?.srsScheduled).toBe(false)
			expect(entry?.scheduledReviews).toHaveLength(1)
		})

		it('excludes a completed review from an SRS-due card', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)
			const cardId = await seedCard(t, topicId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'Due today',
			})
			await seedReview(t, cardId, userAIdentity.subject, {
				date: '2026-08-10',
				rating: 'good',
			})

			const [entry] = await listEntries(
				t,
				userAIdentity.subject,
				'2026-08-10',
			)

			expect(entry?.srsScheduled).toBe(true)
			expect(entry?.scheduledReviews).toEqual([])
		})
	})

	describe('date ranges', () => {
		it('covers `[from, to)` and excludes the end day', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)

			for (const dueDate of ['2026-08-09', '2026-08-10', '2026-08-12']) {
				await seedCard(t, topicId, userAIdentity.subject, {
					dueDate,
					primaryText: `Due ${dueDate}`,
				})
			}

			await expect(
				listByDueDate(t, userAIdentity.subject, {
					from: '2026-08-10',
					to: '2026-08-12',
				}),
			).resolves.toEqual(['2026-08-10 Due 2026-08-10'])
		})

		it('returns an empty range as no entries', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)
			await seedCard(t, topicId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'Due today',
			})

			await expect(
				listByDueDate(t, userAIdentity.subject, {
					from: '2026-08-10',
					to: '2026-08-10',
				}),
			).resolves.toEqual([])
		})

		it('supports a range with only a lower bound', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)

			for (const dueDate of ['2026-08-09', '2026-08-10', '2026-08-12']) {
				await seedCard(t, topicId, userAIdentity.subject, {
					dueDate,
					primaryText: `Due ${dueDate}`,
				})
			}

			await expect(
				listByDueDate(t, userAIdentity.subject, { from: '2026-08-10' }),
			).resolves.toEqual([
				'2026-08-12 Due 2026-08-12',
				'2026-08-10 Due 2026-08-10',
			])
		})

		it('supports a range with only an upper bound', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)

			for (const dueDate of ['2026-08-09', '2026-08-10', '2026-08-12']) {
				await seedCard(t, topicId, userAIdentity.subject, {
					dueDate,
					primaryText: `Due ${dueDate}`,
				})
			}

			await expect(
				listByDueDate(t, userAIdentity.subject, { to: '2026-08-10' }),
			).resolves.toEqual(['2026-08-09 Due 2026-08-09'])
		})

		it('supports a fully unbounded range and excludes undated records', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)
			await seedCard(t, topicId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'Dated card',
			})
			await seedCard(t, topicId, userAIdentity.subject, {
				primaryText: 'Undated card',
			})
			const scheduledCardId = await seedCard(
				t,
				topicId,
				userAIdentity.subject,
				{ primaryText: 'Dated review' },
			)
			await seedReview(t, scheduledCardId, userAIdentity.subject, {
				date: '2026-08-11',
			})
			await seedReview(t, scheduledCardId, userAIdentity.subject, {})

			await expect(
				listByDueDate(t, userAIdentity.subject, {}),
			).resolves.toEqual([
				'2026-08-11 Dated review',
				'2026-08-10 Dated card',
			])
		})

		it('yields one entry per day for a card scheduled on several days', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)
			const cardId = await seedCard(t, topicId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'Recurring',
			})
			await seedReview(t, cardId, userAIdentity.subject, {
				date: '2026-08-12',
			})

			const entries = await listEntries(t, userAIdentity.subject, {
				from: '2026-08-10',
				to: '2026-08-13',
			})

			expect(
				entries.map(entry => [entry.date, entry.srsScheduled]),
			).toEqual([
				['2026-08-12', false],
				['2026-08-10', true],
			])
			// The card doc is reused; only the 08-12 entry carries the review.
			expect(entries[0]?.card._id).toBe(cardId)
			expect(entries[1]?.card._id).toBe(cardId)
			expect(entries[0]?.scheduledReviews).toHaveLength(1)
			expect(entries[1]?.scheduledReviews).toEqual([])
		})

		it('sorts entries by date, then by card creation order, newest first', async () => {
			const t = convexTest(schema, modules)
			const topicId = await seedTopic(t, userAIdentity.subject)
			// Seeded out of date order to prove the sort does the work.
			await seedCard(t, topicId, userAIdentity.subject, {
				dueDate: '2026-08-12',
				primaryText: 'Later',
			})
			await seedCard(t, topicId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'First',
			})
			await seedCard(t, topicId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'Second',
			})

			await expect(
				listByDueDate(t, userAIdentity.subject, {
					from: '2026-08-10',
					to: '2026-08-13',
				}),
			).resolves.toEqual([
				'2026-08-12 Later',
				'2026-08-10 Second',
				'2026-08-10 First',
			])
		})
	})
})
