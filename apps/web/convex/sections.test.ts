import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }

describe('sections', () => {
	it('requires authentication for every public function', async () => {
		const t = convexTest(schema, modules)
		const { collectionId, sectionId } = await t.run(async ctx => {
			const collectionId = await ctx.db.insert('collections', {
				title: 'Collection',
				description: '',
				ownerId: userAIdentity.subject,
				path: [],
				searchText: 'Collection',
			})
			const sectionId = await ctx.db.insert('sections', {
				collectionId,
				ownerId: userAIdentity.subject,
				title: 'Section',
			})

			return { collectionId, sectionId }
		})

		await expect(
			t.query(api.sections.listByCollection, { collectionId }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.sections.create, { collectionId, afterId: null }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.sections.update, { sectionId, title: 'Renamed' }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.sections.move, { sectionId, afterId: null }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.sections.remove, { sectionId }),
		).rejects.toThrow('Unauthenticated')
	})

	it('creates sections with an empty default title and lists them in order', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const otherCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)

		const firstId = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})
		const secondId = await asUserA.mutation(api.sections.create, {
			collectionId,
			title: 'Second',
			afterId: firstId,
		})
		await asUserA.mutation(api.sections.create, {
			collectionId: otherCollectionId,
			afterId: null,
		})

		await expect(
			asUserA.query(api.sections.listByCollection, { collectionId }),
		).resolves.toMatchObject([
			{
				_id: firstId,
				collectionId,
				ownerId: userAIdentity.subject,
				title: '',
			},
			{ _id: secondId, title: 'Second' },
		])
	})

	it('renames a section', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const sectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})

		await asUserA.mutation(api.sections.update, {
			sectionId,
			title: 'Cell anatomy',
		})

		await expect(
			asUserA.query(api.sections.listByCollection, { collectionId }),
		).resolves.toMatchObject([{ _id: sectionId, title: 'Cell anatomy' }])
	})

	it("hides and protects another user's sections", async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const sectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
			title: 'Mine',
			afterId: null,
		})

		await expect(
			asUserB.query(api.sections.listByCollection, { collectionId }),
		).rejects.toThrow('Collection not found')
		await expect(
			asUserB.mutation(api.sections.create, {
				collectionId,
				afterId: null,
			}),
		).rejects.toThrow('Collection not found')
		await expect(
			asUserB.mutation(api.sections.update, {
				sectionId,
				title: 'Stolen',
			}),
		).rejects.toThrow('Section not found')
		await expect(
			asUserB.mutation(api.sections.remove, { sectionId }),
		).rejects.toThrow('Section not found')

		await expect(
			asUserA.query(api.sections.listByCollection, { collectionId }),
		).resolves.toMatchObject([{ _id: sectionId, title: 'Mine' }])
	})

	it('omits sections on an owned collection that belong to someone else', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		await t.run(async ctx =>
			ctx.db.insert('sections', {
				collectionId,
				ownerId: userBIdentity.subject,
				title: 'Foreign',
			}),
		)

		await expect(
			asUserA.query(api.sections.listByCollection, { collectionId }),
		).resolves.toEqual([])
	})

	it('deletes the cards and reviews of a removed section and leaves the rest', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const removedSectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})
		const keptSectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: removedSectionId,
		})
		const removedCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
			sectionId: removedSectionId,
		})
		const sectionedCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
			sectionId: keptSectionId,
		})
		const unsectionedCardId = await asUserA.mutation(api.cards.create, {
			collectionId,
		})
		await asUserA.mutation(api.reviews.create, { cardId: removedCardId })
		const keptReviewId = await asUserA.mutation(api.reviews.create, {
			cardId: sectionedCardId,
		})

		const removed = await asUserA.mutation(api.sections.remove, {
			sectionId: removedSectionId,
		})

		expect(removed).toMatchObject({ _id: removedSectionId, collectionId })
		const remaining = await t.run(async ctx => ({
			sections: await ctx.db.query('sections').collect(),
			cards: await ctx.db.query('cards').collect(),
			reviews: await ctx.db.query('reviews').collect(),
		}))
		expect(remaining.sections.map(section => section._id)).toEqual([
			keptSectionId,
		])
		expect(remaining.cards.map(card => card._id)).toEqual([
			sectionedCardId,
			unsectionedCardId,
		])
		expect(remaining.reviews.map(review => review._id)).toEqual([
			keptReviewId,
		])
	})

	it('deletes the sections of a removed collection subtree', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {})
		const childId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
		})
		const unrelatedId = await asUserA.mutation(api.collections.create, {})
		await asUserA.mutation(api.sections.create, {
			collectionId: rootId,
			afterId: null,
		})
		await asUserA.mutation(api.sections.create, {
			collectionId: childId,
			afterId: null,
		})
		const keptSectionId = await asUserA.mutation(api.sections.create, {
			collectionId: unrelatedId,
			afterId: null,
		})

		await asUserA.mutation(api.collections.remove, { collectionId: rootId })

		const remaining = await t.run(async ctx =>
			ctx.db.query('sections').collect(),
		)
		expect(remaining.map(section => section._id)).toEqual([keptSectionId])
	})

	it('moves a section after another, to the top, and keeps the others in place', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const a = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})
		const b = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: a,
		})
		const c = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: b,
		})
		const order = async () =>
			(
				await asUserA.query(api.sections.listByCollection, {
					collectionId,
				})
			).map(section => section._id)

		await asUserA.mutation(api.sections.move, { sectionId: a, afterId: b })
		await expect(order()).resolves.toEqual([b, a, c])

		await asUserA.mutation(api.sections.move, {
			sectionId: c,
			afterId: null,
		})
		await expect(order()).resolves.toEqual([c, b, a])
	})

	it('creates a section right after another, or first', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const create = (afterId: Id<'sections'> | null) =>
			asUserA.mutation(api.sections.create, { collectionId, afterId })
		const order = async () =>
			(
				await asUserA.query(api.sections.listByCollection, {
					collectionId,
				})
			).map(section => section._id)

		const a = await create(null)
		const c = await create(a)
		const b = await create(a)
		await expect(order()).resolves.toEqual([a, b, c])

		const first = await create(null)
		await expect(order()).resolves.toEqual([first, a, b, c])
	})

	it('backfills unranked sections when creating one between them', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const [a, b] = await t.run(async ctx =>
			Promise.all(
				['A', 'B'].map(title =>
					ctx.db.insert('sections', {
						collectionId,
						ownerId: userAIdentity.subject,
						title,
					}),
				),
			),
		)

		const created = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: a!,
		})

		const sections = await asUserA.query(api.sections.listByCollection, {
			collectionId,
		})
		expect(sections.map(section => section._id)).toEqual([a, created, b])
		expect(sections.every(section => section.rank !== undefined)).toBe(true)
	})

	it('backfills unranked sections when creating one first', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const [a, b] = await t.run(async ctx =>
			Promise.all(
				['A', 'B'].map(title =>
					ctx.db.insert('sections', {
						collectionId,
						ownerId: userAIdentity.subject,
						title,
					}),
				),
			),
		)

		const created = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})

		const sections = await asUserA.query(api.sections.listByCollection, {
			collectionId,
		})
		expect(sections.map(section => section._id)).toEqual([created, a, b])
		expect(sections.every(section => section.rank !== undefined)).toBe(true)
	})

	it('creates a section at the bottom when its anchor was deleted', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const a = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})
		const deleted = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: a,
		})
		const b = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: deleted,
		})
		await asUserA.mutation(api.sections.remove, { sectionId: deleted })

		const created = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: deleted,
		})

		const sections = await asUserA.query(api.sections.listByCollection, {
			collectionId,
		})
		expect(sections.map(section => section._id)).toEqual([a, b, created])
	})

	it('rejects creating after a section in another collection', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const otherCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const otherSectionId = await asUserA.mutation(api.sections.create, {
			collectionId: otherCollectionId,
			afterId: null,
		})

		await expect(
			asUserA.mutation(api.sections.create, {
				collectionId,
				afterId: otherSectionId,
			}),
		).rejects.toThrow('The item to place after is not in this list')
	})

	it('rejects moving after a section in another collection or of another user', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const otherCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const sectionId = await asUserA.mutation(api.sections.create, {
			collectionId,
			afterId: null,
		})
		const otherSectionId = await asUserA.mutation(api.sections.create, {
			collectionId: otherCollectionId,
			afterId: null,
		})

		await expect(
			asUserA.mutation(api.sections.move, {
				sectionId,
				afterId: otherSectionId,
			}),
		).rejects.toThrow('The item to place after is not in this list')
		await expect(
			asUserB.mutation(api.sections.move, { sectionId, afterId: null }),
		).rejects.toThrow('Section not found')
	})

	it('ranks unranked sections in place when one of them moves', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const [a, b, c] = await t.run(async ctx =>
			Promise.all(
				['A', 'B', 'C'].map(title =>
					ctx.db.insert('sections', {
						collectionId,
						ownerId: userAIdentity.subject,
						title,
					}),
				),
			),
		)

		await asUserA.mutation(api.sections.move, {
			sectionId: a!,
			afterId: b!,
		})

		const sections = await asUserA.query(api.sections.listByCollection, {
			collectionId,
		})
		expect(sections.map(section => section._id)).toEqual([b, a, c])
		expect(sections.every(section => section.rank !== undefined)).toBe(true)
	})
})
