import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }

describe('reviewCards', () => {
	it('requires authentication for every public function', async () => {
		const t = convexTest(schema, modules)
		const { topicId, reviewCardId } = await t.run(async ctx => {
			const topicId = await ctx.db.insert('topics', {
				title: 'Topic',
				description: '',
				ownerId: userAIdentity.subject,
			})
			const reviewCardId = await ctx.db.insert('reviewCards', {
				topicId,
				ownerId: userAIdentity.subject,
				type: 'flashcard',
				primaryText: '',
				secondaryText: '',
				notes: '',
				state: 'LEARNING',
			})

			return { reviewCardId, topicId }
		})

		await expect(
			t.query(api.reviewCards.listByTopic, { topicId }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.query(api.reviewCards.get, { reviewCardId }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.reviewCards.create, { topicId }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.reviewCards.update, {
				primaryText: 'Updated',
				reviewCardId,
			}),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.reviewCards.remove, { reviewCardId }),
		).rejects.toThrow('Unauthenticated')
	})

	it('creates cards with defaults and supplied fields', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})

		const defaultCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})
		const filledCardId = await asUserA.mutation(api.reviewCards.create, {
			flaggedAt: 1_700_000_000_000,
			notes: 'Notes',
			primaryText: 'Primary',
			secondaryText: 'Secondary',
			topicId,
			type: 'practice',
		})

		await expect(
			asUserA.query(api.reviewCards.get, {
				reviewCardId: defaultCardId,
			}),
		).resolves.toMatchObject({
			notes: '',
			ownerId: userAIdentity.subject,
			primaryText: '',
			secondaryText: '',
			state: 'LEARNING',
			topicId,
			type: 'flashcard',
		})
		await expect(
			asUserA.query(api.reviewCards.get, { reviewCardId: filledCardId }),
		).resolves.toMatchObject({
			flaggedAt: 1_700_000_000_000,
			notes: 'Notes',
			primaryText: 'Primary',
			secondaryText: 'Secondary',
			type: 'practice',
		})
	})

	it('lists the cards of an owned topic and rejects foreign topics', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const otherTopicId = await asUserA.mutation(api.topics.create, {})
		const foreignTopicId = await asUserB.mutation(api.topics.create, {})

		await asUserA.mutation(api.reviewCards.create, {
			primaryText: 'First',
			topicId,
		})
		await asUserA.mutation(api.reviewCards.create, {
			primaryText: 'Second',
			topicId,
		})
		await asUserA.mutation(api.reviewCards.create, {
			primaryText: 'Elsewhere',
			topicId: otherTopicId,
		})

		const reviewCards = await asUserA.query(api.reviewCards.listByTopic, {
			topicId,
		})

		expect(reviewCards.map(reviewCard => reviewCard.primaryText)).toEqual([
			'First',
			'Second',
		])
		await expect(
			asUserA.query(api.reviewCards.listByTopic, {
				topicId: foreignTopicId,
			}),
		).rejects.toThrow('Topic not found')
	})

	it('omits cards on an owned topic that belong to someone else', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const ownCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})

		// Not reachable through the public API — cards inherit their topic's
		// owner — so plant one directly to prove `listByTopic` does not rely on
		// that invariant holding.
		await t.run(async ctx => {
			await ctx.db.insert('reviewCards', {
				topicId,
				ownerId: userBIdentity.subject,
				type: 'flashcard',
				primaryText: 'Not user A’s',
				secondaryText: '',
				notes: '',
				state: 'LEARNING',
			})
		})

		const reviewCards = await asUserA.query(api.reviewCards.listByTopic, {
			topicId,
		})

		expect(reviewCards.map(reviewCard => reviewCard._id)).toEqual([
			ownCardId,
		])
	})

	it('rejects creating a card under a missing or foreign-owned topic', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const missingTopicId = await asUserA.mutation(api.topics.create, {})
		const foreignTopicId = await asUserB.mutation(api.topics.create, {})

		await asUserA.mutation(api.topics.remove, { topicId: missingTopicId })

		await expect(
			asUserA.mutation(api.reviewCards.create, {
				topicId: missingTopicId,
			}),
		).rejects.toThrow('Topic not found')
		await expect(
			asUserA.mutation(api.reviewCards.create, {
				topicId: foreignTopicId,
			}),
		).rejects.toThrow('Topic not found')
	})

	it('hides missing and foreign-owned cards from every card function', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const foreignTopicId = await asUserB.mutation(api.topics.create, {})
		const foreignCardId = await asUserB.mutation(api.reviewCards.create, {
			topicId: foreignTopicId,
		})
		const missingCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId,
		})

		await asUserA.mutation(api.reviewCards.remove, {
			reviewCardId: missingCardId,
		})

		for (const reviewCardId of [foreignCardId, missingCardId]) {
			await expect(
				asUserA.query(api.reviewCards.get, { reviewCardId }),
			).resolves.toBeNull()
			await expect(
				asUserA.mutation(api.reviewCards.update, {
					primaryText: 'Updated',
					reviewCardId,
				}),
			).rejects.toThrow('Review card not found')
			await expect(
				asUserA.mutation(api.reviewCards.remove, { reviewCardId }),
			).rejects.toThrow('Review card not found')
		}
	})

	it('patches supplied fields and can flag or unflag a card', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			primaryText: 'Original primary',
			secondaryText: 'Original secondary',
			topicId,
		})

		await asUserA.mutation(api.reviewCards.update, {
			flaggedAt: 1_700_000_000_000,
			primaryText: 'Updated primary',
			reviewCardId,
			type: 'practice',
		})

		await expect(
			asUserA.query(api.reviewCards.get, { reviewCardId }),
		).resolves.toMatchObject({
			flaggedAt: 1_700_000_000_000,
			primaryText: 'Updated primary',
			secondaryText: 'Original secondary',
			type: 'practice',
		})

		await asUserA.mutation(api.reviewCards.update, {
			flaggedAt: null,
			reviewCardId,
		})

		const unflagged = await asUserA.query(api.reviewCards.get, {
			reviewCardId,
		})
		expect(unflagged?.flaggedAt).toBeUndefined()
	})

	it('returns the removed card and leaves its siblings alone', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const reviewCardId = await asUserA.mutation(api.reviewCards.create, {
			primaryText: 'Removed',
			topicId,
		})
		const siblingId = await asUserA.mutation(api.reviewCards.create, {
			primaryText: 'Kept',
			topicId,
		})

		const removed = await asUserA.mutation(api.reviewCards.remove, {
			reviewCardId,
		})
		const remaining = await asUserA.query(api.reviewCards.listByTopic, {
			topicId,
		})

		expect(removed).toMatchObject({ _id: reviewCardId, topicId })
		expect(remaining.map(reviewCard => reviewCard._id)).toEqual([siblingId])
	})

	it('deletes the cards of a removed topic subtree', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {})
		const childId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
		})
		const unrelatedId = await asUserA.mutation(api.topics.create, {})

		await asUserA.mutation(api.reviewCards.create, { topicId: rootId })
		await asUserA.mutation(api.reviewCards.create, { topicId: childId })
		const keptCardId = await asUserA.mutation(api.reviewCards.create, {
			topicId: unrelatedId,
		})

		await asUserA.mutation(api.topics.remove, { topicId: rootId })

		const remaining = await t.run(async ctx =>
			ctx.db.query('reviewCards').collect(),
		)
		expect(remaining.map(reviewCard => reviewCard._id)).toEqual([
			keptCardId,
		])
	})
})
