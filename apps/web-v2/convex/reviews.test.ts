import { convexTest } from 'convex-test'
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
})
