import { convexTest } from 'convex-test'
import { DateTime } from 'luxon'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }

describe('reviews', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it('lists only the caller’s reviews for an owned card, newest first', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const otherCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})

		const { firstReviewId, latestReviewId } = await t.run(async ctx => {
			const firstReviewId = await ctx.db.insert('reviews', {
				reviewCardId,
				ownerId: userAIdentity.subject,
				rating: 'hard',
				description: 'First',
				notes: '',
			})
			await ctx.db.insert('reviews', {
				reviewCardId,
				ownerId: userBIdentity.subject,
				rating: 'easy',
				description: 'Foreign',
				notes: '',
			})
			await ctx.db.insert('reviews', {
				reviewCardId: otherCardId,
				ownerId: userAIdentity.subject,
				rating: 'miss',
				description: 'Other card',
				notes: '',
			})
			const latestReviewId = await ctx.db.insert('reviews', {
				reviewCardId,
				ownerId: userAIdentity.subject,
				rating: 'good',
				description: 'Latest',
				notes: '',
			})

			return { firstReviewId, latestReviewId }
		})

		const reviews = await asUserA.query(api.reviews.listByReviewCard, {
			reviewCardId,
		})

		expect(reviews.map(review => review._id)).toEqual([
			latestReviewId,
			firstReviewId,
		])
	})

	it('rejects listing reviews for missing or foreign cards', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const missingCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const foreignTopicId = await asUserB.mutation(api.topics.create, {})
		const foreignCardId = await asUserB.mutation(api.reviewCards.create, {
			topicId: foreignTopicId,
		})

		await asUserA.mutation(api.reviewCards.remove, {
			reviewCardId: missingCardId,
		})

		for (const reviewCardId of [foreignCardId, missingCardId]) {
			await expect(
				asUserA.query(api.reviews.listByReviewCard, { reviewCardId }),
			).rejects.toThrow('Review card not found')
		}
	})

	it('gets an owned review and rejects missing or foreign reviews', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const foreignTopicId = await asUserB.mutation(api.topics.create, {})
		const foreignCardId = await asUserB.mutation(api.reviewCards.create, {
			topicId: foreignTopicId,
		})

		const { ownedReviewId, foreignReviewId, missingReviewId } = await t.run(
			async ctx => {
				const ownedReviewId = await ctx.db.insert('reviews', {
					reviewCardId,
					ownerId: userAIdentity.subject,
					rating: 'good',
					description: 'Owned',
					notes: '',
				})
				const foreignReviewId = await ctx.db.insert('reviews', {
					reviewCardId: foreignCardId,
					ownerId: userBIdentity.subject,
					rating: 'easy',
					description: 'Foreign',
					notes: '',
				})
				const missingReviewId = await ctx.db.insert('reviews', {
					reviewCardId,
					ownerId: userAIdentity.subject,
					rating: 'miss',
					description: 'Missing',
					notes: '',
				})
				await ctx.db.delete('reviews', missingReviewId)

				return { ownedReviewId, foreignReviewId, missingReviewId }
			},
		)

		await expect(
			asUserA.query(api.reviews.get, { reviewId: ownedReviewId }),
		).resolves.toMatchObject({
			_id: ownedReviewId,
			description: 'Owned',
		})

		for (const reviewId of [foreignReviewId, missingReviewId]) {
			await expect(
				asUserA.query(api.reviews.get, { reviewId }),
			).rejects.toThrow('Review not found')
		}
	})

	it('patches supplied fields and can clear a rating or date', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			date: '2024-01-01',
			description: 'Original',
			rating: 'hard',
			reviewCardId,
		})

		await asUserA.mutation(api.reviews.update, {
			description: 'Updated',
			rating: 'good',
			reviewId,
		})

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({
			date: '2024-01-01',
			description: 'Updated',
			rating: 'good',
		})

		await asUserA.mutation(api.reviews.update, {
			date: null,
			rating: null,
			reviewId,
		})

		const cleared = await asUserA.query(api.reviews.get, { reviewId })
		expect(cleared.rating).toBeUndefined()
		expect(cleared.date).toBeUndefined()
	})

	it('preserves the completion day when omitted and applies it when passed', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			reviewCardId,
		})

		await asUserA.mutation(api.reviews.update, {
			date: '2026-08-09',
			rating: 'hard',
			reviewId,
		})

		const completed = await asUserA.query(api.reviews.get, { reviewId })
		expect(completed.date).toBe('2026-08-09')

		await asUserA.mutation(api.reviews.update, {
			rating: 'easy',
			reviewId,
		})

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({
			date: completed.date,
			rating: 'easy',
		})

		await asUserA.mutation(api.reviews.update, {
			date: '2026-08-08',
			rating: 'hard',
			reviewId,
		})

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({ date: '2026-08-08', rating: 'hard' })
	})

	it('completes on the scheduled day when none is submitted', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-08-01',
			reviewCardId,
		})

		await asUserA.mutation(api.reviews.update, {
			rating: 'good',
			reviewId,
		})

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({ date: '2026-08-01', rating: 'good' })
		await expect(
			asUserA.query(api.reviewCards.get, { reviewCardId }),
		).resolves.toMatchObject({ lastReviewedAt: '2026-08-01' })

		await asUserA.mutation(api.reviews.update, {
			date: '2026-08-09',
			rating: 'good',
			reviewId,
		})

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({ date: '2026-08-09', rating: 'good' })
		await expect(
			asUserA.query(api.reviewCards.get, { reviewCardId }),
		).resolves.toMatchObject({ lastReviewedAt: '2026-08-09' })
	})

	it('rejects rated creates without dates and contradictory completion patches', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})

		await expect(
			asUserA.mutation(api.reviews.create, {
				rating: 'hard',
				reviewCardId,
			}),
		).rejects.toThrow('requires an explicit date')

		const reviewId = await asUserA.mutation(api.reviews.create, {
			reviewCardId,
		})
		await expect(
			asUserA.mutation(api.reviews.update, {
				date: null,
				rating: 'hard',
				reviewId,
			}),
		).rejects.toThrow('cannot have a null date')

		// Neither the patch nor the stored review carries a day to complete on.
		await expect(
			asUserA.mutation(api.reviews.update, {
				rating: 'hard',
				reviewId,
			}),
		).rejects.toThrow('requires an explicit date')

		const reviews = await asUserA.query(api.reviews.listByReviewCard, {
			reviewCardId,
		})
		expect(reviews).toHaveLength(1)
		expect(reviews[0]?.rating).toBeUndefined()
		expect(reviews[0]?.date).toBeUndefined()
	})

	it('refuses to clear the date of a completed review on its own', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-08-09',
			rating: 'good',
			reviewCardId,
		})

		await expect(
			asUserA.mutation(api.reviews.update, { date: null, reviewId }),
		).rejects.toThrow('cannot have a null date')

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({ date: '2026-08-09', rating: 'good' })

		// Reopening the review and clearing its day together is allowed.
		await asUserA.mutation(api.reviews.update, {
			date: null,
			rating: null,
			reviewId,
		})

		const reopened = await asUserA.query(api.reviews.get, { reviewId })
		expect(reopened.rating).toBeUndefined()
		expect(reopened.date).toBeUndefined()
	})

	it('rejects malformed dates without changing persisted or derived state', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})

		await expect(
			asUserA.mutation(api.reviews.create, {
				date: '+012345-01-01',
				rating: 'good',
				reviewCardId,
			}),
		).rejects.toThrow('Invalid date-only value')

		const reviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-08-01',
			rating: 'good',
			reviewCardId,
		})
		const reviewBefore = await asUserA.query(api.reviews.get, { reviewId })
		const cardBefore = await asUserA.query(api.reviewCards.get, {
			reviewCardId,
		})

		await expect(
			asUserA.mutation(api.reviews.update, {
				date: '+012345-01-01',
				reviewId,
			}),
		).rejects.toThrow('Invalid date-only value')

		expect(await asUserA.query(api.reviews.get, { reviewId })).toEqual(
			reviewBefore,
		)
		expect(
			await asUserA.query(api.reviewCards.get, { reviewCardId }),
		).toEqual(cardBefore)
	})

	it('bounds completed dates while allowing future schedules', async () => {
		vi.useFakeTimers()
		vi.setSystemTime(
			DateTime.fromISO('2026-08-09T23:59:59.999Z').toJSDate(),
		)

		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const tomorrow = DateTime.utc().plus({ days: 1 }).toISODate()!
		const dayAfterTomorrow = DateTime.utc().plus({ days: 2 }).toISODate()!

		const completedReviewId = await asUserA.mutation(api.reviews.create, {
			date: tomorrow,
			rating: 'good',
			reviewCardId,
		})
		const completedBefore = await asUserA.query(api.reviews.get, {
			reviewId: completedReviewId,
		})
		const cardBefore = await asUserA.query(api.reviewCards.get, {
			reviewCardId,
		})
		await expect(
			asUserA.mutation(api.reviews.update, {
				date: dayAfterTomorrow,
				reviewId: completedReviewId,
			}),
		).rejects.toThrow("Can't have a completed review in the future")
		expect(
			await asUserA.query(api.reviews.get, {
				reviewId: completedReviewId,
			}),
		).toEqual(completedBefore)
		expect(
			await asUserA.query(api.reviewCards.get, { reviewCardId }),
		).toEqual(cardBefore)
		await expect(
			asUserA.mutation(api.reviews.create, {
				date: '2099-12-31',
				reviewCardId,
			}),
		).resolves.toBeDefined()
	})

	// The date rules postdate any review already in the database, so applying
	// them to a stored date nobody is editing would strand such a row: its
	// autosaved notes would fail forever with no in-app way to repair it.
	it.each([
		['a far-future day', DateTime.utc().plus({ days: 30 }).toISODate()!],
		['a non-canonical day', '2026-8-9'],
	])('edits notes on a completed review stored with %s', async (_, date) => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await t.run(async ctx =>
			ctx.db.insert('reviews', {
				date,
				description: '',
				notes: '',
				ownerId: 'user-a',
				rating: 'good' as const,
				reviewCardId,
			}),
		)

		await asUserA.mutation(api.reviews.update, {
			notes: 'still editable',
			reviewId,
		})

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({
			date,
			notes: 'still editable',
			rating: 'good',
		})
	})

	it('reopens a review onto its existing day when only the rating is cleared', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			reviewCardId,
		})

		await asUserA.mutation(api.reviews.update, {
			date: '2024-05-04',
			rating: 'good',
			reviewId,
		})
		await asUserA.mutation(api.reviews.update, {
			date: '2024-05-05',
			reviewId,
		})

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({ date: '2024-05-05', rating: 'good' })

		await asUserA.mutation(api.reviews.update, { rating: null, reviewId })

		const reopened = await asUserA.query(api.reviews.get, { reviewId })
		expect(reopened.rating).toBeUndefined()
		expect(reopened.date).toBe('2024-05-05')
	})

	it('rejects updating a missing or foreign review', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			reviewCardId,
		})
		const missingReviewId = await t.run(async ctx => {
			const id = await ctx.db.insert('reviews', {
				description: '',
				notes: '',
				ownerId: userAIdentity.subject,
				reviewCardId,
			})
			await ctx.db.delete('reviews', id)
			return id
		})

		for (const targetId of [reviewId, missingReviewId]) {
			await expect(
				(targetId === reviewId ? asUserB : asUserA).mutation(
					api.reviews.update,
					{ description: 'Hijacked', reviewId: targetId },
				),
			).rejects.toThrow('Review not found')
		}
	})

	it('returns the removed review and leaves its siblings alone', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const removedId = await asUserA.mutation(api.reviews.create, {
			description: 'Removed',
			reviewCardId,
		})
		const siblingId = await asUserA.mutation(api.reviews.create, {
			description: 'Kept',
			reviewCardId,
		})

		const removed = await asUserA.mutation(api.reviews.remove, {
			reviewId: removedId,
		})
		const remaining = await asUserA.query(api.reviews.listByReviewCard, {
			reviewCardId,
		})

		expect(removed).toMatchObject({ _id: removedId, reviewCardId })
		expect(remaining.map(review => review._id)).toEqual([siblingId])
	})

	it('rejects removing a missing or foreign review', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			reviewCardId,
		})
		const missingReviewId = await t.run(async ctx => {
			const id = await ctx.db.insert('reviews', {
				description: '',
				notes: '',
				ownerId: userAIdentity.subject,
				reviewCardId,
			})
			await ctx.db.delete('reviews', id)
			return id
		})

		for (const targetId of [reviewId, missingReviewId]) {
			await expect(
				(targetId === reviewId ? asUserB : asUserA).mutation(
					api.reviews.remove,
					{ reviewId: targetId },
				),
			).rejects.toThrow('Review not found')
		}
	})

	it('completing a review advances the card and records SRS snapshots', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			reviewCardId,
		})

		await asUserA.mutation(api.reviews.update, {
			date: '2026-01-10',
			rating: 'good',
			reviewId,
		})

		const review = await asUserA.query(api.reviews.get, { reviewId })
		const card = await asUserA.query(api.reviewCards.get, { reviewCardId })

		expect(review).toMatchObject({
			difficultyAfter: expect.any(Number),
			dueDateAfter: expect.any(String),
			dueDateBefore: '2026-01-10',
			stateAfter: 'LEARNING',
			stateBefore: 'LEARNING',
			stabilityAfter: expect.any(Number),
		})
		expect(card).toMatchObject({
			difficulty: review.difficultyAfter,
			dueDate: review.dueDateAfter,
			lastReviewedAt: '2026-01-10',
			stability: review.stabilityAfter,
			state: review.stateAfter,
			step: review.stepAfter,
		})
	})

	it('re-rating an older review rewrites the downstream replay chain', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const firstReviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-01-01',
			rating: 'good',
			reviewCardId,
		})
		const secondReviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-01-10',
			rating: 'good',
			reviewCardId,
		})
		const secondBefore = await asUserA.query(api.reviews.get, {
			reviewId: secondReviewId,
		})

		await asUserA.mutation(api.reviews.update, {
			rating: 'easy',
			reviewId: firstReviewId,
		})

		const firstAfter = await asUserA.query(api.reviews.get, {
			reviewId: firstReviewId,
		})
		const secondAfter = await asUserA.query(api.reviews.get, {
			reviewId: secondReviewId,
		})
		const card = await asUserA.query(api.reviewCards.get, { reviewCardId })

		expect(secondAfter.stabilityBefore).toBe(firstAfter.stabilityAfter)
		expect(secondAfter.difficultyBefore).toBe(firstAfter.difficultyAfter)
		expect(secondAfter.stabilityAfter).not.toBe(secondBefore.stabilityAfter)
		expect(card?.stability).toBe(secondAfter.stabilityAfter)
		expect(card?.dueDate).toBe(secondAfter.dueDateAfter)
		expect(card?.lastReviewedAt).toBe('2026-01-10')
	})

	it('replays snapshots and card state when a completion moves across another', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const firstReviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-01-01',
			rating: 'good',
			reviewCardId,
		})
		const secondReviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-01-10',
			rating: 'hard',
			reviewCardId,
		})
		const secondBeforeMove = await asUserA.query(api.reviews.get, {
			reviewId: secondReviewId,
		})

		await asUserA.mutation(api.reviews.update, {
			date: '2026-01-15',
			reviewId: firstReviewId,
		})

		const secondAfterLaterMove = await asUserA.query(api.reviews.get, {
			reviewId: secondReviewId,
		})
		const firstAfterLaterMove = await asUserA.query(api.reviews.get, {
			reviewId: firstReviewId,
		})
		const cardAfterLaterMove = await asUserA.query(api.reviewCards.get, {
			reviewCardId,
		})

		expect(secondAfterLaterMove).toMatchObject({
			date: '2026-01-10',
			stateBefore: 'LEARNING',
			dueDateBefore: '2026-01-10',
		})
		expect(secondAfterLaterMove.stabilityBefore).not.toBe(
			secondBeforeMove.stabilityBefore,
		)
		expect(firstAfterLaterMove).toMatchObject({
			date: '2026-01-15',
			stabilityBefore: secondAfterLaterMove.stabilityAfter,
			difficultyBefore: secondAfterLaterMove.difficultyAfter,
			stateBefore: secondAfterLaterMove.stateAfter,
			stepBefore: secondAfterLaterMove.stepAfter,
			dueDateBefore: secondAfterLaterMove.dueDateAfter,
		})
		expect(cardAfterLaterMove).toMatchObject({
			stability: firstAfterLaterMove.stabilityAfter,
			difficulty: firstAfterLaterMove.difficultyAfter,
			state: firstAfterLaterMove.stateAfter,
			step: firstAfterLaterMove.stepAfter,
			dueDate: firstAfterLaterMove.dueDateAfter,
			lastReviewedAt: '2026-01-15',
		})

		await asUserA.mutation(api.reviews.update, {
			date: '2026-01-01',
			reviewId: firstReviewId,
		})

		const firstAfterEarlierMove = await asUserA.query(api.reviews.get, {
			reviewId: firstReviewId,
		})
		const secondAfterEarlierMove = await asUserA.query(api.reviews.get, {
			reviewId: secondReviewId,
		})
		const cardAfterEarlierMove = await asUserA.query(api.reviewCards.get, {
			reviewCardId,
		})

		expect(secondAfterEarlierMove).toMatchObject({
			date: '2026-01-10',
			stabilityBefore: firstAfterEarlierMove.stabilityAfter,
			difficultyBefore: firstAfterEarlierMove.difficultyAfter,
			stateBefore: firstAfterEarlierMove.stateAfter,
			stepBefore: firstAfterEarlierMove.stepAfter,
			dueDateBefore: firstAfterEarlierMove.dueDateAfter,
		})
		expect(cardAfterEarlierMove).toMatchObject({
			stability: secondAfterEarlierMove.stabilityAfter,
			difficulty: secondAfterEarlierMove.difficultyAfter,
			state: secondAfterEarlierMove.stateAfter,
			step: secondAfterEarlierMove.stepAfter,
			dueDate: secondAfterEarlierMove.dueDateAfter,
			lastReviewedAt: '2026-01-10',
		})
	})

	it('un-rating a review clears its snapshots and rewinds the card', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const firstReviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-01-01',
			rating: 'good',
			reviewCardId,
		})
		const secondReviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-01-10',
			rating: 'hard',
			reviewCardId,
		})

		await asUserA.mutation(api.reviews.update, {
			rating: null,
			reviewId: secondReviewId,
		})

		const first = await asUserA.query(api.reviews.get, {
			reviewId: firstReviewId,
		})
		const second = await asUserA.query(api.reviews.get, {
			reviewId: secondReviewId,
		})
		const card = await asUserA.query(api.reviewCards.get, { reviewCardId })

		expect(second.rating).toBeUndefined()
		// Un-rating reopens the review rather than unscheduling it.
		expect(second.date).toBe('2026-01-10')
		for (const field of [
			'stabilityBefore',
			'difficultyBefore',
			'stateBefore',
			'stepBefore',
			'dueDateBefore',
			'stabilityAfter',
			'difficultyAfter',
			'stateAfter',
			'stepAfter',
			'dueDateAfter',
		] as const) {
			expect(second[field]).toBeUndefined()
		}
		expect(card).toMatchObject({
			difficulty: first.difficultyAfter,
			dueDate: first.dueDateAfter,
			lastReviewedAt: '2026-01-01',
			stability: first.stabilityAfter,
			state: first.stateAfter,
		})
	})

	it('deleting the only completed review resets the card to fresh state', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-01-01',
			rating: 'good',
			reviewCardId,
		})

		await asUserA.mutation(api.reviews.remove, { reviewId })

		const card = await asUserA.query(api.reviewCards.get, { reviewCardId })
		expect(card?.state).toBe('LEARNING')
		expect(card?.stability).toBeUndefined()
		expect(card?.difficulty).toBeUndefined()
		expect(card?.step).toBe(0)
		expect(card?.dueDate).toBeUndefined()
		expect(card?.lastReviewedAt).toBeUndefined()
	})

	it('creates future dated reviews as schedules without changing SRS state', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})

		const scheduledReviewId = await asUserA.mutation(api.reviews.create, {
			date: '2026-01-01',
			reviewCardId,
		})
		const scheduled = await asUserA.query(api.reviews.get, {
			reviewId: scheduledReviewId,
		})
		expect(scheduled.date).toBe('2026-01-01')
		expect(scheduled.rating).toBeUndefined()

		// A scheduled review contributes nothing to the card's SRS state.
		const card = await asUserA.query(api.reviewCards.get, { reviewCardId })
		expect(card?.lastReviewedAt).toBeUndefined()
	})
})
