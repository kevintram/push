import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import type * as Due from './model/due'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }

type Harness = ReturnType<typeof convexTest>

async function seedCollection(
	t: Harness,
	ownerId: string,
): Promise<Id<'collections'>> {
	return await t.run(
		async ctx =>
			await ctx.db.insert('collections', {
				description: '',
				ownerId,
				path: [],
				searchText: 'Collection',
				title: 'Collection',
			}),
	)
}

async function seedCard(
	t: Harness,
	collectionId: Id<'collections'>,
	ownerId: string,
	fields: { dueDate?: string; primaryText: string },
): Promise<Id<'cards'>> {
	return await t.run(
		async ctx =>
			await ctx.db.insert('cards', {
				notes: '',
				ownerId,
				secondaryText: '',
				searchText: fields.primaryText,
				state: 'LEARNING',
				collectionId,
				type: 'flashcard',
				...fields,
			}),
	)
}

async function seedReview(
	t: Harness,
	cardId: Id<'cards'>,
	ownerId: string,
	fields: { date?: string; rating?: 'good' },
): Promise<void> {
	await t.run(async ctx => {
		await ctx.db.insert('reviews', {
			description: '',
			notes: '',
			ownerId,
			cardId,
			...fields,
		})
	})
}

async function listEntries(
	t: Harness,
	userId: string,
	dueDate: string | Due.DueDateRange,
): Promise<Array<Due.DueEntry>> {
	return await t
		.withIdentity({ subject: userId })
		.query(api.due.list, { dueDate })
}

/** The entries as `date` / `primaryText` pairs, for order-sensitive asserts. */
async function list(
	t: Harness,
	userId: string,
	dueDate: string | Due.DueDateRange,
): Promise<Array<string>> {
	const entries = await listEntries(t, userId, dueDate)

	return entries.map(entry => `${entry.date} ${entry.card.primaryText}`)
}

describe('due.list', () => {
	it('requires authentication', async () => {
		const t = convexTest(schema, modules)

		await expect(
			t.query(api.due.list, { dueDate: '2026-08-10' }),
		).rejects.toThrow('Unauthenticated')
	})

	it('returns cards due on the date and cards with a review scheduled that day', async () => {
		const t = convexTest(schema, modules)
		const collectionId = await seedCollection(t, userAIdentity.subject)
		await seedCard(t, collectionId, userAIdentity.subject, {
			dueDate: '2026-08-10',
			primaryText: 'Due today',
		})
		const scheduledCardId = await seedCard(
			t,
			collectionId,
			userAIdentity.subject,
			{ primaryText: 'Scheduled today' },
		)
		await seedCard(t, collectionId, userAIdentity.subject, {
			dueDate: '2026-08-11',
			primaryText: 'Due tomorrow',
		})
		await seedReview(t, scheduledCardId, userAIdentity.subject, {
			date: '2026-08-10',
		})

		await expect(
			list(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual([
			'2026-08-10 Scheduled today',
			'2026-08-10 Due today',
		])
	})

	it('excludes overdue cards and reviews from before the due date', async () => {
		const t = convexTest(schema, modules)
		const collectionId = await seedCollection(t, userAIdentity.subject)
		await seedCard(t, collectionId, userAIdentity.subject, {
			dueDate: '2026-08-08',
			primaryText: 'Overdue card',
		})
		const overdueCardId = await seedCard(
			t,
			collectionId,
			userAIdentity.subject,
			{ primaryText: 'Overdue review' },
		)
		await seedReview(t, overdueCardId, userAIdentity.subject, {
			date: '2026-08-08',
		})

		await expect(
			list(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual([])
	})

	it('returns a card once when it has several scheduled reviews that day', async () => {
		const t = convexTest(schema, modules)
		const collectionId = await seedCollection(t, userAIdentity.subject)
		// No `dueDate`, so the card is only reachable through its reviews — the
		// path where an async dedupe check would push it twice.
		const cardId = await seedCard(t, collectionId, userAIdentity.subject, {
			primaryText: 'Busy card',
		})
		await seedReview(t, cardId, userAIdentity.subject, {
			date: '2026-08-10',
		})
		await seedReview(t, cardId, userAIdentity.subject, {
			date: '2026-08-10',
		})

		await expect(
			list(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual(['2026-08-10 Busy card'])
	})

	it('ignores completed reviews', async () => {
		const t = convexTest(schema, modules)
		const collectionId = await seedCollection(t, userAIdentity.subject)
		await seedCard(t, collectionId, userAIdentity.subject, {
			dueDate: '2026-08-10',
			primaryText: 'Due today',
		})
		const ratedCardId = await seedCard(
			t,
			collectionId,
			userAIdentity.subject,
			{
				primaryText: 'Already reviewed',
			},
		)
		await seedReview(t, ratedCardId, userAIdentity.subject, {
			date: '2026-08-10',
			rating: 'good',
		})

		await expect(
			list(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual(['2026-08-10 Due today'])
	})

	it("never returns another user's cards", async () => {
		const t = convexTest(schema, modules)
		const collectionId = await seedCollection(t, userBIdentity.subject)
		const cardId = await seedCard(t, collectionId, userBIdentity.subject, {
			dueDate: '2026-08-10',
			primaryText: "User B's card",
		})
		await seedReview(t, cardId, userBIdentity.subject, {
			date: '2026-08-10',
		})

		await expect(
			list(t, userAIdentity.subject, '2026-08-10'),
		).resolves.toEqual([])
	})

	it('rejects malformed dates', async () => {
		const t = convexTest(schema, modules)

		await expect(
			list(t, userAIdentity.subject, '2026-8-10'),
		).rejects.toThrow('Invalid date-only value')
	})

	it('rejects malformed and inverted ranges', async () => {
		const t = convexTest(schema, modules)

		await expect(
			list(t, userAIdentity.subject, {
				from: '2026-8-10',
				to: '2026-08-12',
			}),
		).rejects.toThrow('Invalid date-only value')

		await expect(
			list(t, userAIdentity.subject, {
				from: '2026-08-12',
				to: '2026-08-10',
			}),
		).rejects.toThrow('Invalid date range')
	})

	describe('entry fields', () => {
		it('flags SRS-due cards and carries their uncompleted reviews', async () => {
			const t = convexTest(schema, modules)
			const collectionId = await seedCollection(t, userAIdentity.subject)
			const cardId = await seedCard(
				t,
				collectionId,
				userAIdentity.subject,
				{
					dueDate: '2026-08-10',
					primaryText: 'Due today',
				},
			)
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
			expect(entry?.scheduledReviews[0]?.cardId).toBe(cardId)
		})

		it('gives an SRS-due card with no review row an empty review list', async () => {
			const t = convexTest(schema, modules)
			const collectionId = await seedCollection(t, userAIdentity.subject)
			await seedCard(t, collectionId, userAIdentity.subject, {
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
			const collectionId = await seedCollection(t, userAIdentity.subject)
			// Due on another day, so this entry exists only via its review.
			const cardId = await seedCard(
				t,
				collectionId,
				userAIdentity.subject,
				{
					dueDate: '2026-09-01',
					primaryText: 'Hand-scheduled',
				},
			)
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
			const collectionId = await seedCollection(t, userAIdentity.subject)
			const cardId = await seedCard(
				t,
				collectionId,
				userAIdentity.subject,
				{
					dueDate: '2026-08-10',
					primaryText: 'Due today',
				},
			)
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
			const collectionId = await seedCollection(t, userAIdentity.subject)

			for (const dueDate of ['2026-08-09', '2026-08-10', '2026-08-12']) {
				await seedCard(t, collectionId, userAIdentity.subject, {
					dueDate,
					primaryText: `Due ${dueDate}`,
				})
			}

			await expect(
				list(t, userAIdentity.subject, {
					from: '2026-08-10',
					to: '2026-08-12',
				}),
			).resolves.toEqual(['2026-08-10 Due 2026-08-10'])
		})

		it('returns an empty range as no entries', async () => {
			const t = convexTest(schema, modules)
			const collectionId = await seedCollection(t, userAIdentity.subject)
			await seedCard(t, collectionId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'Due today',
			})

			await expect(
				list(t, userAIdentity.subject, {
					from: '2026-08-10',
					to: '2026-08-10',
				}),
			).resolves.toEqual([])
		})

		it('supports a range with only a lower bound', async () => {
			const t = convexTest(schema, modules)
			const collectionId = await seedCollection(t, userAIdentity.subject)

			for (const dueDate of ['2026-08-09', '2026-08-10', '2026-08-12']) {
				await seedCard(t, collectionId, userAIdentity.subject, {
					dueDate,
					primaryText: `Due ${dueDate}`,
				})
			}

			await expect(
				list(t, userAIdentity.subject, { from: '2026-08-10' }),
			).resolves.toEqual([
				'2026-08-12 Due 2026-08-12',
				'2026-08-10 Due 2026-08-10',
			])
		})

		it('supports a range with only an upper bound', async () => {
			const t = convexTest(schema, modules)
			const collectionId = await seedCollection(t, userAIdentity.subject)

			for (const dueDate of ['2026-08-09', '2026-08-10', '2026-08-12']) {
				await seedCard(t, collectionId, userAIdentity.subject, {
					dueDate,
					primaryText: `Due ${dueDate}`,
				})
			}

			await expect(
				list(t, userAIdentity.subject, { to: '2026-08-10' }),
			).resolves.toEqual(['2026-08-09 Due 2026-08-09'])
		})

		it('supports a fully unbounded range and excludes undated records', async () => {
			const t = convexTest(schema, modules)
			const collectionId = await seedCollection(t, userAIdentity.subject)
			await seedCard(t, collectionId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'Dated card',
			})
			await seedCard(t, collectionId, userAIdentity.subject, {
				primaryText: 'Undated card',
			})
			const scheduledCardId = await seedCard(
				t,
				collectionId,
				userAIdentity.subject,
				{ primaryText: 'Dated review' },
			)
			await seedReview(t, scheduledCardId, userAIdentity.subject, {
				date: '2026-08-11',
			})
			await seedReview(t, scheduledCardId, userAIdentity.subject, {})

			await expect(list(t, userAIdentity.subject, {})).resolves.toEqual([
				'2026-08-11 Dated review',
				'2026-08-10 Dated card',
			])
		})

		it('yields one entry per day for a card scheduled on several days', async () => {
			const t = convexTest(schema, modules)
			const collectionId = await seedCollection(t, userAIdentity.subject)
			const cardId = await seedCard(
				t,
				collectionId,
				userAIdentity.subject,
				{
					dueDate: '2026-08-10',
					primaryText: 'Recurring',
				},
			)
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
			const collectionId = await seedCollection(t, userAIdentity.subject)
			// Seeded out of date order to prove the sort does the work.
			await seedCard(t, collectionId, userAIdentity.subject, {
				dueDate: '2026-08-12',
				primaryText: 'Later',
			})
			await seedCard(t, collectionId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'First',
			})
			await seedCard(t, collectionId, userAIdentity.subject, {
				dueDate: '2026-08-10',
				primaryText: 'Second',
			})

			await expect(
				list(t, userAIdentity.subject, {
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
