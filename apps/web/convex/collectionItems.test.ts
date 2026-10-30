import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { compareRanked } from '../shared/ordering'
import { api } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }

describe('collectionItems', () => {
	it('requires authentication for every public function', async () => {
		const t = convexTest(schema, modules)
		const collectionId = await t.run(async ctx =>
			ctx.db.insert('collections', {
				title: 'Collection',
				description: '',
				ownerId: userAIdentity.subject,
				path: [],
				searchText: 'Collection',
			}),
		)

		await expect(
			t.mutation(api.collectionItems.moveToCollection, {
				sectionIds: [],
				cardIds: [],
				collectionId,
			}),
		).rejects.toMatchObject({ data: "You've been signed out" })
		await expect(
			t.mutation(api.collectionItems.remove, {
				sectionIds: [],
				cardIds: [],
			}),
		).rejects.toMatchObject({ data: "You've been signed out" })
	})

	it('deletes the sections with their cards and reviews, and the other cards', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const removedSectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})
		const keptSectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})
		const inRemovedSectionId = await asUserA.mutation(api.cards.create, {
			collectionId,
			sectionId: removedSectionId,
		})
		const looseCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
			sectionId: keptSectionId,
		})
		const keptCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
			sectionId: keptSectionId,
		})
		await asUserA.mutation(api.reviews.create, {
			cardId: inRemovedSectionId,
		})
		const keptReviewId = await asUserA.mutation(api.reviews.create, {
			cardId: keptCardId,
		})

		// The card inside the removed section is named too, as when both are
		// selected, and is deleted once.
		await asUserA.mutation(api.collectionItems.remove, {
			sectionIds: [removedSectionId],
			cardIds: [inRemovedSectionId, looseCardId],
		})

		const remaining = await t.run(async ctx => ({
			sections: await ctx.db.query('sections').collect(),
			cards: await ctx.db.query('cards').collect(),
			reviews: await ctx.db.query('reviews').collect(),
		}))
		expect(remaining.sections.map(section => section._id)).toEqual([
			keptSectionId,
		])
		expect(remaining.cards.map(card => card._id)).toEqual([keptCardId])
		expect(remaining.reviews.map(review => review._id)).toEqual([
			keptReviewId,
		])
	})

	it('moves sections with their cards, and the other cards, to the bottom of another collection', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const destinationId = await asUserA.mutation(api.collections.create, {})
		const sectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})
		const keptSectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})
		const existingSectionId = await asUserA.mutation(api.sections.create, {
			collectionId: destinationId,
			afterId: null,
		})
		const firstId = await asUserA.mutation(api.cards.create, {
			collectionId,
			sectionId,
		})
		const secondId = await asUserA.mutation(api.cards.create, {
			collectionId,
			sectionId,
		})
		const looseCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
			sectionId: keptSectionId,
		})
		const keptCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
			sectionId: keptSectionId,
		})
		const existingCardId = await asUserA.mutation(api.cards.create, {
			collectionId: destinationId,
		})
		// Reordered, so creation order alone would get it wrong.
		await asUserA.mutation(api.cards.move, {
			cardIds: [secondId],
			sectionId,
			afterId: null,
		})

		// The card inside the moving section is named too, as when both are
		// selected, and stays in its section.
		await asUserA.mutation(api.collectionItems.moveToCollection, {
			sectionIds: [sectionId],
			cardIds: [firstId, looseCardId],
			collectionId: destinationId,
		})

		await expect(
			asUserA.query(api.sections.listByCollection, { collectionId }),
		).resolves.toMatchObject([{ _id: keptSectionId }])
		await expect(
			asUserA.query(api.sections.listByCollection, {
				collectionId: destinationId,
			}),
		).resolves.toMatchObject([
			{ _id: existingSectionId },
			{ _id: sectionId, collectionId: destinationId },
		])
		const kept = await asUserA.query(api.cards.listByCollection, {
			collectionId,
		})
		expect(kept.map(card => card._id)).toEqual([keptCardId])
		const moved = (
			await asUserA.query(api.cards.listByCollection, {
				collectionId: destinationId,
			})
		).sort(compareRanked)
		expect(
			moved
				.filter(card => card.sectionId === sectionId)
				.map(card => card._id),
		).toEqual([secondId, firstId])
		expect(
			moved
				.filter(card => card.sectionId === undefined)
				.map(card => card._id),
		).toEqual([existingCardId, looseCardId])
	})

	it("rejects another user's items or destination, and changes nothing", async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const sectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})
		const cardId = await asUserA.mutation(api.cards.create, {
			collectionId,
		})
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{},
		)
		const foreignCardId = await asUserB.mutation(api.cards.create, {
			collectionId: foreignCollectionId,
		})

		await expect(
			asUserA.mutation(api.collectionItems.moveToCollection, {
				sectionIds: [sectionId],
				cardIds: [cardId],
				collectionId: foreignCollectionId,
			}),
		).rejects.toMatchObject({ data: 'Collection not found' })
		await expect(
			asUserB.mutation(api.collectionItems.moveToCollection, {
				sectionIds: [sectionId],
				cardIds: [],
				collectionId: foreignCollectionId,
			}),
		).rejects.toMatchObject({ data: 'Section not found' })
		await expect(
			asUserA.mutation(api.collectionItems.remove, {
				sectionIds: [sectionId],
				cardIds: [cardId, foreignCardId],
			}),
		).rejects.toMatchObject({ data: 'Card not found' })

		await expect(
			asUserA.query(api.sections.listByCollection, { collectionId }),
		).resolves.toMatchObject([{ _id: sectionId }])
		await expect(
			asUserA.query(api.cards.listByCollection, { collectionId }),
		).resolves.toMatchObject([{ _id: cardId }])
	})
})
