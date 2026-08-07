import { convexTest } from 'convex-test'
import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'

import { api } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }

describe('reviews', () => {
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

	it('dates an undated review on the day it is rated and keeps that day when re-rated', async () => {
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
			rating: 'hard',
			reviewId,
		})

		const completed = await asUserA.query(api.reviews.get, { reviewId })
		expect(completed.date).toBe(DateTime.utc().toISODate())

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

	it('clears the rating when the date is cleared', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			date: '2024-05-04',
			rating: 'good',
			reviewCardId,
		})

		await asUserA.mutation(api.reviews.update, { date: null, reviewId })

		const review = await asUserA.query(api.reviews.get, { reviewId })
		expect(review.rating).toBeUndefined()
		expect(review.date).toBeUndefined()
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
			dueAfter: expect.any(String),
			dueBefore: '2026-01-10',
			stateAfter: 'LEARNING',
			stateBefore: 'LEARNING',
			stabilityAfter: expect.any(Number),
		})
		expect(card).toMatchObject({
			difficulty: review.difficultyAfter,
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
		expect(card?.lastReviewedAt).toBe('2026-01-10')
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
			'dueBefore',
			'stabilityAfter',
			'difficultyAfter',
			'stateAfter',
			'stepAfter',
			'dueAfter',
		] as const) {
			expect(second[field]).toBeUndefined()
		}
		expect(card).toMatchObject({
			difficulty: first.difficultyAfter,
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
		expect(card?.lastReviewedAt).toBeUndefined()
	})

	it('creates a dated review as scheduled and a rated review as completed today', async () => {
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
		const ratedReviewId = await asUserA.mutation(api.reviews.create, {
			rating: 'hard',
			reviewCardId,
		})

		const scheduled = await asUserA.query(api.reviews.get, {
			reviewId: scheduledReviewId,
		})
		expect(scheduled.date).toBe('2026-01-01')
		expect(scheduled.rating).toBeUndefined()

		await expect(
			asUserA.query(api.reviews.get, { reviewId: ratedReviewId }),
		).resolves.toMatchObject({
			date: DateTime.utc().toISODate(),
			rating: 'hard',
		})

		// A scheduled review contributes nothing to the card's SRS state.
		const card = await asUserA.query(api.reviewCards.get, { reviewCardId })
		expect(card?.lastReviewedAt).toBe(DateTime.utc().toISODate())
	})
})
