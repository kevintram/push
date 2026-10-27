import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }
const userCIdentity = { subject: 'user-c' }

describe('cards', () => {
	it('requires authentication for every public function', async () => {
		const t = convexTest(schema, modules)
		const { collectionId, cardId } = await t.run(async ctx => {
			const collectionId = await ctx.db.insert('collections', {
				title: 'Collection',
				description: '',
				ownerId: userAIdentity.subject,
				path: [],
				searchText: 'Collection',
			})
			const cardId = await ctx.db.insert('cards', {
				collectionId,
				ownerId: userAIdentity.subject,
				type: 'flashcard',
				primaryText: '',
				secondaryText: '',
				notes: '',
				state: 'LEARNING',
				searchText: '',
			})

			return { cardId, collectionId }
		})

		await expect(
			t.query(api.cards.listByCollection, { collectionId }),
		).rejects.toThrow('Unauthenticated')
		await expect(t.query(api.cards.listFlagged, {})).rejects.toThrow(
			'Unauthenticated',
		)
		await expect(t.query(api.cards.get, { cardId })).rejects.toThrow(
			'Unauthenticated',
		)
		await expect(
			t.query(api.cards.search, { query: 'card' }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.cards.create, { collectionId }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.cards.update, {
				primaryText: 'Updated',
				cardId,
			}),
		).rejects.toThrow('Unauthenticated')
		await expect(t.mutation(api.cards.remove, { cardId })).rejects.toThrow(
			'Unauthenticated',
		)
	})

	it('creates cards with defaults and supplied fields', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})

		const defaultCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
		})
		const filledCardId = await asUserA.mutation(api.cards.create, {
			flaggedAt: 1_700_000_000_000,
			notes: 'Notes',
			primaryText: 'Primary',
			secondaryText: 'Secondary',
			collectionId,
			type: 'flashcard',
		})

		await expect(
			asUserA.query(api.cards.get, {
				cardId: defaultCardId,
			}),
		).resolves.toMatchObject({
			notes: '',
			ownerId: userAIdentity.subject,
			primaryText: '',
			secondaryText: '',
			state: 'LEARNING',
			collectionId,
			type: 'practice',
		})
		expect(
			(
				await asUserA.query(api.cards.get, {
					cardId: defaultCardId,
				})
			).lastReview,
		).toBeUndefined()
		await expect(
			asUserA.query(api.cards.get, { cardId: filledCardId }),
		).resolves.toMatchObject({
			flaggedAt: 1_700_000_000_000,
			notes: 'Notes',
			primaryText: 'Primary',
			secondaryText: 'Secondary',
			type: 'flashcard',
		})
	})

	it('lists the cards of an owned collection and rejects foreign collections', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const otherCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{},
		)

		await asUserA.mutation(api.cards.create, {
			primaryText: 'First',
			collectionId,
		})
		await asUserA.mutation(api.cards.create, {
			primaryText: 'Second',
			collectionId,
		})
		await asUserA.mutation(api.cards.create, {
			primaryText: 'Elsewhere',
			collectionId: otherCollectionId,
		})

		const cards = await asUserA.query(api.cards.listByCollection, {
			collectionId,
		})

		expect(cards.map(card => card.primaryText)).toEqual(['First', 'Second'])
		await expect(
			asUserA.query(api.cards.listByCollection, {
				collectionId: foreignCollectionId,
			}),
		).rejects.toThrow('Collection not found')
	})

	it('omits cards on an owned collection that belong to someone else', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const ownCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
		})

		// Not reachable through the public API — cards inherit their collection's
		// owner — so plant one directly to prove `listByCollection` does not rely on
		// that invariant holding.
		await t.run(async ctx => {
			await ctx.db.insert('cards', {
				collectionId,
				ownerId: userBIdentity.subject,
				type: 'flashcard',
				primaryText: 'Not user A’s',
				secondaryText: '',
				notes: '',
				state: 'LEARNING',
				searchText: 'Not user A’s',
			})
		})

		const cards = await asUserA.query(api.cards.listByCollection, {
			collectionId,
		})

		expect(cards.map(card => card._id)).toEqual([ownCardId])
	})

	it("lists only the current user's flagged cards newest first", async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const asUserC = t.withIdentity(userCIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{},
		)

		const oldestId = await asUserA.mutation(api.cards.create, {
			flaggedAt: 1_700_000_000_000,
			primaryText: 'Oldest',
			collectionId,
		})
		const newestId = await asUserA.mutation(api.cards.create, {
			flaggedAt: 1_800_000_000_000,
			primaryText: 'Newest',
			collectionId,
		})
		await asUserA.mutation(api.cards.create, { collectionId })
		await asUserB.mutation(api.cards.create, {
			flaggedAt: 1_900_000_000_000,
			primaryText: 'Foreign',
			collectionId: foreignCollectionId,
		})

		const flagged = await asUserA.query(api.cards.listFlagged, {})

		expect(flagged.map(card => card._id)).toEqual([newestId, oldestId])
		expect(flagged.map(card => card.primaryText)).toEqual([
			'Newest',
			'Oldest',
		])
		await expect(asUserC.query(api.cards.listFlagged, {})).resolves.toEqual(
			[],
		)
	})

	it('rejects creating a card under a missing or foreign-owned collection', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const missingCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{},
		)

		await asUserA.mutation(api.collections.remove, {
			collectionId: missingCollectionId,
		})

		await expect(
			asUserA.mutation(api.cards.create, {
				collectionId: missingCollectionId,
			}),
		).rejects.toThrow('Collection not found')
		await expect(
			asUserA.mutation(api.cards.create, {
				collectionId: foreignCollectionId,
			}),
		).rejects.toThrow('Collection not found')
	})

	it('hides missing and foreign-owned cards from every card function', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{},
		)
		const foreignCardId = await asUserB.mutation(api.cards.create, {
			collectionId: foreignCollectionId,
		})
		const missingCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
		})

		await asUserA.mutation(api.cards.remove, {
			cardId: missingCardId,
		})

		for (const cardId of [foreignCardId, missingCardId]) {
			await expect(
				asUserA.query(api.cards.get, { cardId }),
			).rejects.toThrow('Card not found')
			await expect(
				asUserA.mutation(api.cards.update, {
					primaryText: 'Updated',
					cardId,
				}),
			).rejects.toThrow('Card not found')
			await expect(
				asUserA.mutation(api.cards.remove, { cardId }),
			).rejects.toThrow('Card not found')
		}
	})

	it('patches supplied fields and can flag or unflag a card', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const cardId = await asUserA.mutation(api.cards.create, {
			primaryText: 'Original primary',
			secondaryText: 'Original secondary',
			collectionId,
		})

		await asUserA.mutation(api.cards.update, {
			flaggedAt: 1_700_000_000_000,
			primaryText: 'Updated primary',
			cardId,
			type: 'practice',
		})

		await expect(
			asUserA.query(api.cards.get, { cardId }),
		).resolves.toMatchObject({
			flaggedAt: 1_700_000_000_000,
			primaryText: 'Updated primary',
			secondaryText: 'Original secondary',
			type: 'practice',
		})

		await asUserA.mutation(api.cards.update, {
			flaggedAt: null,
			cardId,
		})

		const unflagged = await asUserA.query(api.cards.get, {
			cardId,
		})
		expect(unflagged?.flaggedAt).toBeUndefined()
	})

	it('retires and unretires a card, and leaves it alone when omitted', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const cardId = await asUserA.mutation(api.cards.create, {
			primaryText: 'Original primary',
			collectionId,
		})

		const active = await asUserA.query(api.cards.get, { cardId })
		expect(active?.retiredAt).toBeUndefined()

		await asUserA.mutation(api.cards.update, {
			cardId,
			retiredAt: 1_700_000_000_000,
		})

		await expect(
			asUserA.query(api.cards.get, { cardId }),
		).resolves.toMatchObject({ retiredAt: 1_700_000_000_000 })

		// Omitted leaves the existing value alone.
		await asUserA.mutation(api.cards.update, {
			cardId,
			primaryText: 'Updated primary',
		})

		await expect(
			asUserA.query(api.cards.get, { cardId }),
		).resolves.toMatchObject({
			primaryText: 'Updated primary',
			retiredAt: 1_700_000_000_000,
		})

		await asUserA.mutation(api.cards.update, { cardId, retiredAt: null })

		const unretired = await asUserA.query(api.cards.get, { cardId })
		expect(unretired?.retiredAt).toBeUndefined()
	})

	it('creates a card already retired', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const cardId = await asUserA.mutation(api.cards.create, {
			collectionId,
			retiredAt: 1_700_000_000_000,
		})

		await expect(
			asUserA.query(api.cards.get, { cardId }),
		).resolves.toMatchObject({ retiredAt: 1_700_000_000_000 })
	})

	it('moves a card between owned collections', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const sourceCollectionId = await asUserA.mutation(
			api.collections.create,
			{
				title: 'Source',
			},
		)
		const destinationCollectionId = await asUserA.mutation(
			api.collections.create,
			{
				title: 'Destination',
			},
		)
		const cardId = await asUserA.mutation(api.cards.create, {
			collectionId: sourceCollectionId,
		})

		await asUserA.mutation(api.cards.update, {
			cardId,
			collectionId: destinationCollectionId,
		})

		await expect(
			asUserA.query(api.cards.get, { cardId }),
		).resolves.toMatchObject({ collectionId: destinationCollectionId })
		await expect(
			asUserA.query(api.cards.listByCollection, {
				collectionId: sourceCollectionId,
			}),
		).resolves.toEqual([])
		await expect(
			asUserA.query(api.cards.listByCollection, {
				collectionId: destinationCollectionId,
			}),
		).resolves.toMatchObject([{ _id: cardId }])
	})

	it('rejects moving a card to a missing or foreign-owned collection', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const sourceCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const missingCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{},
		)
		const cardId = await asUserA.mutation(api.cards.create, {
			collectionId: sourceCollectionId,
		})

		await asUserA.mutation(api.collections.remove, {
			collectionId: missingCollectionId,
		})

		for (const collectionId of [missingCollectionId, foreignCollectionId]) {
			await expect(
				asUserA.mutation(api.cards.update, {
					cardId,
					collectionId,
				}),
			).rejects.toThrow('Collection not found')
		}

		await expect(
			asUserA.query(api.cards.get, { cardId }),
		).resolves.toMatchObject({ collectionId: sourceCollectionId })
	})

	it('creates a card only in an owned section of its own collection', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const sectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
		})
		const otherCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const otherSectionId = await asUserA.mutation(api.sections.create, {
			collectionId: otherCollectionId,
		})
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{},
		)
		const foreignSectionId = await asUserB.mutation(api.sections.create, {
			collectionId: foreignCollectionId,
		})

		await expect(
			asUserA.mutation(api.cards.create, {
				collectionId,
				sectionId: otherSectionId,
			}),
		).rejects.toThrow("Section is not in the card's collection")
		await expect(
			asUserA.mutation(api.cards.create, {
				collectionId,
				sectionId: foreignSectionId,
			}),
		).rejects.toThrow('Section not found')
		const cardId = await asUserA.mutation(api.cards.create, {
			collectionId,
			sectionId,
		})

		await expect(
			asUserA.query(api.cards.listByCollection, { collectionId }),
		).resolves.toMatchObject([{ _id: cardId, sectionId }])
	})

	it('moves a card into a section, and unsections it with null', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const sectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
		})
		const cardId = await asUserA.mutation(api.cards.create, {
			collectionId,
		})

		await asUserA.mutation(api.cards.update, { cardId, sectionId })
		await expect(
			asUserA.query(api.cards.get, { cardId }),
		).resolves.toMatchObject({ sectionId })

		// An unrelated patch leaves the section alone.
		await asUserA.mutation(api.cards.update, { cardId, notes: 'Notes' })
		await expect(
			asUserA.query(api.cards.get, { cardId }),
		).resolves.toMatchObject({ sectionId })

		await asUserA.mutation(api.cards.update, { cardId, sectionId: null })
		expect(
			(await asUserA.query(api.cards.get, { cardId })).sectionId,
		).toBeUndefined()
	})

	it('unsections a card that moves to another collection without a section', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const sourceCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const destinationCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const sectionId = await asUserA.mutation(api.sections.create, {
			collectionId: sourceCollectionId,
		})
		const cardId = await asUserA.mutation(api.cards.create, {
			collectionId: sourceCollectionId,
			sectionId,
		})

		await asUserA.mutation(api.cards.update, {
			cardId,
			collectionId: destinationCollectionId,
		})

		const card = await asUserA.query(api.cards.get, { cardId })
		expect(card.collectionId).toBe(destinationCollectionId)
		expect(card.sectionId).toBeUndefined()
	})

	it('moves a card into a section of its destination collection in one patch', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const sourceCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const destinationCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const sourceSectionId = await asUserA.mutation(api.sections.create, {
			collectionId: sourceCollectionId,
		})
		const destinationSectionId = await asUserA.mutation(
			api.sections.create,
			{ collectionId: destinationCollectionId },
		)
		const cardId = await asUserA.mutation(api.cards.create, {
			collectionId: sourceCollectionId,
		})

		// The section is judged against the destination, not the source.
		await expect(
			asUserA.mutation(api.cards.update, {
				cardId,
				collectionId: destinationCollectionId,
				sectionId: sourceSectionId,
			}),
		).rejects.toThrow("Section is not in the card's collection")
		await asUserA.mutation(api.cards.update, {
			cardId,
			collectionId: destinationCollectionId,
			sectionId: destinationSectionId,
		})

		await expect(
			asUserA.query(api.cards.get, { cardId }),
		).resolves.toMatchObject({
			collectionId: destinationCollectionId,
			sectionId: destinationSectionId,
		})
	})

	it('returns the removed card and leaves its siblings alone', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const cardId = await asUserA.mutation(api.cards.create, {
			primaryText: 'Removed',
			collectionId,
		})
		const siblingId = await asUserA.mutation(api.cards.create, {
			primaryText: 'Kept',
			collectionId,
		})

		const removed = await asUserA.mutation(api.cards.remove, {
			cardId,
		})
		const remaining = await asUserA.query(api.cards.listByCollection, {
			collectionId,
		})

		expect(removed).toMatchObject({ _id: cardId, collectionId })
		expect(remaining.map(card => card._id)).toEqual([siblingId])
	})

	it('deletes the reviews of a removed card and leaves sibling reviews alone', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const removedCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
		})
		const keptCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
		})
		await asUserA.mutation(api.reviews.create, {
			cardId: removedCardId,
		})
		await asUserA.mutation(api.reviews.create, {
			cardId: removedCardId,
		})
		const keptReviewId = await asUserA.mutation(api.reviews.create, {
			cardId: keptCardId,
		})

		await asUserA.mutation(api.cards.remove, {
			cardId: removedCardId,
		})

		const remaining = await t.run(async ctx =>
			ctx.db.query('reviews').collect(),
		)
		expect(remaining.map(review => review._id)).toEqual([keptReviewId])
	})

	it("searches every card text field without leaking another owner's cards", async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{},
		)
		const primaryMatchId = await asUserA.mutation(api.cards.create, {
			primaryText: 'Mitochondria produce energy',
			collectionId,
		})
		const secondaryMatchId = await asUserA.mutation(api.cards.create, {
			primaryText: 'Organelle answer',
			secondaryText: 'Chloroplast',
			collectionId,
		})
		const notesMatchId = await asUserA.mutation(api.cards.create, {
			notes: 'Remember homeostasis',
			collectionId,
		})
		await asUserB.mutation(api.cards.create, {
			primaryText: 'Mitochondria private card',
			collectionId: foreignCollectionId,
		})

		await expect(
			asUserA.query(api.cards.search, { query: 'Mitochondria' }),
		).resolves.toMatchObject([{ _id: primaryMatchId }])
		await expect(
			asUserA.query(api.cards.search, { query: 'Chloroplast' }),
		).resolves.toMatchObject([{ _id: secondaryMatchId }])
		await expect(
			asUserA.query(api.cards.search, { query: 'homeostasis' }),
		).resolves.toMatchObject([{ _id: notesMatchId }])
		await expect(
			asUserA.query(api.cards.search, { query: '   ' }),
		).resolves.toEqual([])
	})

	it('keeps card search text synchronized through edits', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const cardId = await asUserA.mutation(api.cards.create, {
			primaryText: 'Oldterm',
			collectionId,
		})

		await asUserA.mutation(api.cards.update, {
			primaryText: 'Newterm',
			cardId,
		})

		await expect(
			asUserA.query(api.cards.search, { query: 'Oldterm' }),
		).resolves.toEqual([])
		await expect(
			asUserA.query(api.cards.search, { query: 'Newterm' }),
		).resolves.toMatchObject([{ _id: cardId }])
	})

	it('includes the containing collection in a search hit path for a root collection card', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root collection',
		})
		await asUserA.mutation(api.cards.create, {
			primaryText: 'Findme',
			collectionId: rootId,
		})

		await expect(
			asUserA.query(api.cards.search, { query: 'Findme' }),
		).resolves.toMatchObject([{ pathTitles: ['Root collection'] }])
	})

	it('includes every ancestor and the containing collection root-first for a deeply nested card', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Math',
		})
		const parentId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Calculus',
		})
		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId,
			title: 'Derivatives',
		})
		await asUserA.mutation(api.cards.create, {
			primaryText: 'Findme',
			collectionId,
		})

		await expect(
			asUserA.query(api.cards.search, { query: 'Findme' }),
		).resolves.toMatchObject([
			{ pathTitles: ['Math', 'Calculus', 'Derivatives'] },
		])
	})

	it('gives cards sharing a collection identical location paths', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {
			title: 'Shared collection',
		})
		await asUserA.mutation(api.cards.create, {
			primaryText: 'Shared match one',
			collectionId,
		})
		await asUserA.mutation(api.cards.create, {
			primaryText: 'Shared match two',
			collectionId,
		})

		const results = await asUserA.query(api.cards.search, {
			query: 'Shared match',
		})

		expect(results).toHaveLength(2)
		expect(
			results.every(
				result =>
					result.pathTitles.length === 1 &&
					result.pathTitles[0] === 'Shared collection',
			),
		).toBe(true)
	})

	it('changes the returned path when a card moves to another owned collection', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const originCollectionId = await asUserA.mutation(
			api.collections.create,
			{
				title: 'Origin',
			},
		)
		const destinationCollectionId = await asUserA.mutation(
			api.collections.create,
			{
				title: 'Destination',
			},
		)
		const cardId = await asUserA.mutation(api.cards.create, {
			primaryText: 'Findme',
			collectionId: originCollectionId,
		})

		await asUserA.mutation(api.cards.update, {
			cardId,
			collectionId: destinationCollectionId,
		})

		await expect(
			asUserA.query(api.cards.search, { query: 'Findme' }),
		).resolves.toMatchObject([{ pathTitles: ['Destination'] }])
	})

	it('changes the returned path when a containing collection is renamed or reparented', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const oldRootId = await asUserA.mutation(api.collections.create, {
			title: 'Old root',
		})
		const newRootId = await asUserA.mutation(api.collections.create, {
			title: 'New root',
		})
		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId: oldRootId,
			title: 'Old collection name',
		})
		await asUserA.mutation(api.cards.create, {
			primaryText: 'Findme',
			collectionId,
		})

		await asUserA.mutation(api.collections.update, {
			parentId: newRootId,
			title: 'New collection name',
			collectionId,
		})

		await expect(
			asUserA.query(api.cards.search, { query: 'Findme' }),
		).resolves.toMatchObject([
			{ pathTitles: ['New root', 'New collection name'] },
		])
	})

	it('degrades to an empty path for an orphaned card rather than leaking foreign data', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{
				title: 'Foreign collection',
			},
		)

		await t.run(async ctx => {
			await ctx.db.insert('cards', {
				notes: '',
				ownerId: userAIdentity.subject,
				primaryText: 'Findme orphan',
				secondaryText: '',
				searchText: 'Findme orphan',
				state: 'LEARNING',
				collectionId: foreignCollectionId,
				type: 'flashcard',
			})
		})

		await expect(
			asUserA.query(api.cards.search, { query: 'Findme' }),
		).resolves.toMatchObject([{ pathTitles: [] }])
	})

	it("drops a foreign-owned ancestor from an owned card's collection path", async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{
				title: 'Foreign secret',
			},
		)
		const collectionId = await asUserA.mutation(api.collections.create, {
			title: 'Owned collection',
		})
		await asUserA.mutation(api.cards.create, {
			primaryText: 'Findme card',
			collectionId,
		})

		// Malformed data: the card and its containing collection are owned, but the
		// collection's server-owned path references another user's live collection.
		await t.run(async ctx => {
			await ctx.db.patch('collections', collectionId, {
				path: [foreignCollectionId],
			})
		})

		await expect(
			asUserA.query(api.cards.search, { query: 'Findme' }),
		).resolves.toMatchObject([
			{ pathTitles: ['Owned collection'], primaryText: 'Findme card' },
		])
	})

	it('deletes the cards and reviews of a removed collection subtree', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {})
		const childId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
		})
		const unrelatedId = await asUserA.mutation(api.collections.create, {})

		const rootCardId = await asUserA.mutation(api.cards.create, {
			collectionId: rootId,
		})
		const childCardId = await asUserA.mutation(api.cards.create, {
			collectionId: childId,
		})
		const keptCardId = await asUserA.mutation(api.cards.create, {
			collectionId: unrelatedId,
		})
		await asUserA.mutation(api.reviews.create, {
			cardId: rootCardId,
		})
		await asUserA.mutation(api.reviews.create, {
			cardId: childCardId,
		})
		const keptReviewId = await asUserA.mutation(api.reviews.create, {
			cardId: keptCardId,
		})

		await asUserA.mutation(api.collections.remove, { collectionId: rootId })

		const remaining = await t.run(async ctx => ({
			cards: await ctx.db.query('cards').collect(),
			reviews: await ctx.db.query('reviews').collect(),
		}))
		expect(remaining.cards.map(card => card._id)).toEqual([keptCardId])
		expect(remaining.reviews.map(review => review._id)).toEqual([
			keptReviewId,
		])
	})
})
