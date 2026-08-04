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

	it('patches supplied fields and can clear a rating, schedule, or completion', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const reviewId = await asUserA.mutation(api.reviews.create, {
			description: 'Original',
			rating: 'hard',
			reviewCardId,
			scheduledAt: '2024-01-01',
		})

		await asUserA.mutation(api.reviews.update, {
			description: 'Updated',
			rating: 'good',
			reviewId,
		})

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({
			description: 'Updated',
			rating: 'good',
			scheduledAt: '2024-01-01',
		})

		await asUserA.mutation(api.reviews.update, {
			completedAt: null,
			rating: null,
			reviewId,
			scheduledAt: null,
		})

		const cleared = await asUserA.query(api.reviews.get, { reviewId })
		expect(cleared.rating).toBeUndefined()
		expect(cleared.scheduledAt).toBeUndefined()
		expect(cleared.completedAt).toBeUndefined()
	})

	it('completes an unrated review when rated and preserves its completion day when re-rated', async () => {
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
		expect(completed.completedAt).toBe(DateTime.utc().toISODate())

		await asUserA.mutation(api.reviews.update, {
			rating: 'easy',
			reviewId,
		})

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({
			completedAt: completed.completedAt,
			rating: 'easy',
		})
	})

	it('keeps completion fields coupled while allowing explicit re-dating', async () => {
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
			completedAt: '2024-05-04',
			rating: 'good',
			reviewId,
		})
		await asUserA.mutation(api.reviews.update, {
			completedAt: '2024-05-05',
			reviewId,
		})
		await asUserA.mutation(api.reviews.update, {
			scheduledAt: '2024-06-01',
			reviewId,
		})

		await expect(
			asUserA.query(api.reviews.get, { reviewId }),
		).resolves.toMatchObject({
			completedAt: '2024-05-05',
			rating: 'good',
			scheduledAt: '2024-06-01',
		})

		await asUserA.mutation(api.reviews.update, {
			rating: null,
			reviewId,
		})
		let review = await asUserA.query(api.reviews.get, { reviewId })
		expect(review.rating).toBeUndefined()
		expect(review.completedAt).toBeUndefined()

		await asUserA.mutation(api.reviews.update, {
			rating: 'good',
			reviewId,
		})
		await asUserA.mutation(api.reviews.update, {
			completedAt: null,
			reviewId,
		})
		review = await asUserA.query(api.reviews.get, { reviewId })
		expect(review.rating).toBeUndefined()
		expect(review.completedAt).toBeUndefined()
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
})
