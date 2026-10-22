import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }

describe('collections', () => {
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

		await expect(t.query(api.collections.list, {})).rejects.toThrow(
			'Unauthenticated',
		)
		await expect(
			t.query(api.collections.listChildren, { collectionId }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.query(api.collections.get, { expandPath: false, collectionId }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.query(api.collections.get, { expandPath: true, collectionId }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.query(api.collections.search, { query: 'Collection' }),
		).rejects.toThrow('Unauthenticated')
		await expect(t.mutation(api.collections.create, {})).rejects.toThrow(
			'Unauthenticated',
		)
		await expect(
			t.mutation(api.collections.update, {
				collectionId,
				title: 'Updated',
			}),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.collections.remove, { collectionId }),
		).rejects.toThrow('Unauthenticated')
	})

	it('stores the ancestor chain on each collection, root-first and excluding self', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const parentId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Parent',
		})
		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId,
			title: 'Collection',
		})

		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: rootId,
			}),
		).resolves.toMatchObject({ path: [] })
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: parentId,
			}),
		).resolves.toMatchObject({ path: [rootId] })
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId,
			}),
		).resolves.toMatchObject({ path: [rootId, parentId] })
	})

	it('rewrites the paths of every descendant when a mid-tree collection moves', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const oldRootId = await asUserA.mutation(api.collections.create, {
			title: 'Old root',
		})
		const newRootId = await asUserA.mutation(api.collections.create, {
			title: 'New root',
		})
		const movedId = await asUserA.mutation(api.collections.create, {
			parentId: oldRootId,
			title: 'Moved',
		})
		const childId = await asUserA.mutation(api.collections.create, {
			parentId: movedId,
			title: 'Child',
		})
		const grandchildId = await asUserA.mutation(api.collections.create, {
			parentId: childId,
			title: 'Grandchild',
		})

		await asUserA.mutation(api.collections.update, {
			parentId: newRootId,
			collectionId: movedId,
		})

		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: movedId,
			}),
		).resolves.toMatchObject({ path: [newRootId] })
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: childId,
			}),
		).resolves.toMatchObject({ path: [newRootId, movedId] })
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: grandchildId,
			}),
		).resolves.toMatchObject({ path: [newRootId, movedId, childId] })
	})

	it('empties the path and rewrites descendants when a collection detaches to the root', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const movedId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Moved',
		})
		const childId = await asUserA.mutation(api.collections.create, {
			parentId: movedId,
			title: 'Child',
		})

		await asUserA.mutation(api.collections.update, {
			parentId: null,
			collectionId: movedId,
		})

		const moved = await asUserA.query(api.collections.get, {
			expandPath: false,
			collectionId: movedId,
		})
		expect(moved.parentId).toBeUndefined()
		expect(moved.path).toEqual([])
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: childId,
			}),
		).resolves.toMatchObject({ path: [movedId] })
	})

	it('leaves the path untouched when an update does not move the collection', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Collection',
		})

		await asUserA.mutation(api.collections.update, {
			title: 'Renamed',
			collectionId,
		})

		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId,
			}),
		).resolves.toMatchObject({ path: [rootId], title: 'Renamed' })
	})

	it('does not inspect or rewrite paths when a re-save names the same parent', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Collection',
		})
		const childId = await asUserA.mutation(api.collections.create, {
			parentId: collectionId,
			title: 'Child',
		})

		// Path integrity is maintained by hierarchy mutations, not audited by
		// unrelated updates or a no-op parent assignment.
		await t.run(async ctx => {
			await ctx.db.patch('collections', collectionId, { path: [] })
			await ctx.db.patch('collections', childId, { path: [collectionId] })
		})

		await asUserA.mutation(api.collections.update, {
			parentId: rootId,
			title: 'Renamed',
			collectionId,
		})

		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId,
			}),
		).resolves.toMatchObject({
			parentId: rootId,
			path: [],
			title: 'Renamed',
		})
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: childId,
			}),
		).resolves.toMatchObject({ path: [collectionId] })
	})

	it('expands the ancestor chain root-first, excluding the collection itself', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const parentId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Parent',
		})
		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId,
			title: 'Collection',
		})

		await expect(
			asUserA.query(api.collections.get, {
				expandPath: true,
				collectionId,
			}),
		).resolves.toMatchObject({
			path: [{ title: 'Root' }, { title: 'Parent' }],
			title: 'Collection',
		})
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: true,
				collectionId: rootId,
			}),
		).resolves.toMatchObject({ path: [], title: 'Root' })
	})

	it('leaves the ancestor chain as ids when expandPath is false', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Collection',
		})

		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId,
			}),
		).resolves.toMatchObject({ path: [rootId], title: 'Collection' })
	})

	it('follows a reparent when expanding ancestors', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const oldParentId = await asUserA.mutation(api.collections.create, {
			title: 'Old parent',
		})
		const newParentId = await asUserA.mutation(api.collections.create, {
			title: 'New parent',
		})
		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId: oldParentId,
			title: 'Collection',
		})

		await asUserA.mutation(api.collections.update, {
			parentId: newParentId,
			collectionId,
		})

		await expect(
			asUserA.query(api.collections.get, {
				expandPath: true,
				collectionId,
			}),
		).resolves.toMatchObject({ path: [{ title: 'New parent' }] })
	})

	it('drops ancestors that no longer resolve rather than throwing', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Collection',
		})

		// Delete the ancestor out from under the stored `path` without the
		// cascade that keeps the two consistent, so the read is torn the way a
		// concurrent removal would leave it.
		await t.run(async ctx => {
			await ctx.db.delete('collections', rootId)
		})

		await expect(
			asUserA.query(api.collections.get, {
				expandPath: true,
				collectionId,
			}),
		).resolves.toMatchObject({ path: [], title: 'Collection' })
	})

	it('refuses to expand ancestors for a collection owned by another user', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Collection',
		})

		await expect(
			asUserB.query(api.collections.get, {
				expandPath: true,
				collectionId,
			}),
		).rejects.toThrow('Collection not found')
	})

	it('lists only collections owned by the authenticated user', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)

		await asUserA.mutation(api.collections.create, { title: 'A1' })
		await asUserA.mutation(api.collections.create, { title: 'A2' })
		await asUserB.mutation(api.collections.create, { title: 'B1' })

		const collections = await asUserA.query(api.collections.list, {})

		expect(collections).toHaveLength(2)
		expect(collections.map(collection => collection.title)).toEqual([
			'A1',
			'A2',
		])
		expect(
			collections.every(
				collection => collection.ownerId === userAIdentity.subject,
			),
		).toBe(true)
	})

	it('lists only the direct children of a collection, oldest first', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const firstChildId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'First child',
		})
		await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Second child',
		})
		await asUserA.mutation(api.collections.create, {
			parentId: firstChildId,
			title: 'Grandchild',
		})
		await asUserA.mutation(api.collections.create, { title: 'Other root' })

		const children = await asUserA.query(api.collections.listChildren, {
			collectionId: rootId,
		})

		expect(children.map(child => child.title)).toEqual([
			'First child',
			'Second child',
		])
	})

	it('refuses to list children of a foreign-owned collection and hides foreign-owned children', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Owned child',
		})
		await t.run(async ctx =>
			ctx.db.insert('collections', {
				description: '',
				ownerId: userBIdentity.subject,
				parentId: rootId,
				path: [rootId],
				searchText: 'Foreign child',
				title: 'Foreign child',
			}),
		)

		await expect(
			asUserB.query(api.collections.listChildren, {
				collectionId: rootId,
			}),
		).rejects.toThrow('Collection not found')
		await expect(
			asUserA.query(api.collections.listChildren, {
				collectionId: rootId,
			}),
		).resolves.toEqual([expect.objectContaining({ title: 'Owned child' })])
	})

	it('creates collections with defaults and supplied parent fields', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const parentId = await asUserA.mutation(api.collections.create, {
			title: 'Parent',
		})

		const defaultCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const childId = await asUserA.mutation(api.collections.create, {
			description: 'Description',
			parentId,
			title: 'Child',
		})

		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: defaultCollectionId,
			}),
		).resolves.toMatchObject({
			description: '',
			ownerId: userAIdentity.subject,
			title: '',
		})
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: childId,
			}),
		).resolves.toMatchObject({
			description: 'Description',
			ownerId: userAIdentity.subject,
			parentId,
			title: 'Child',
		})
	})

	it('rejects missing and foreign-owned parents during creation', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const missingParentId = await asUserA.mutation(
			api.collections.create,
			{},
		)
		const foreignParentId = await asUserB.mutation(
			api.collections.create,
			{},
		)

		await asUserA.mutation(api.collections.remove, {
			collectionId: missingParentId,
		})

		await expect(
			asUserA.mutation(api.collections.create, {
				parentId: missingParentId,
			}),
		).rejects.toThrow('Parent collection not found')
		await expect(
			asUserA.mutation(api.collections.create, {
				parentId: foreignParentId,
			}),
		).rejects.toThrow('Parent collection not found')
	})

	it('gets owned collections while hiding missing and foreign-owned collections', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const ownedCollectionId = await asUserA.mutation(
			api.collections.create,
			{
				title: 'Owned',
			},
		)
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{},
		)
		const missingCollectionId = await asUserA.mutation(
			api.collections.create,
			{},
		)

		await asUserA.mutation(api.collections.remove, {
			collectionId: missingCollectionId,
		})

		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: ownedCollectionId,
			}),
		).resolves.toMatchObject({ title: 'Owned' })
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: foreignCollectionId,
			}),
		).rejects.toThrow('Collection not found')
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: missingCollectionId,
			}),
		).rejects.toThrow('Collection not found')
	})

	it('patches supplied fields and can assign or unset a parent', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const parentId = await asUserA.mutation(api.collections.create, {})
		const collectionId = await asUserA.mutation(api.collections.create, {
			description: 'Original description',
			title: 'Original title',
		})

		await asUserA.mutation(api.collections.update, {
			parentId,
			title: 'Updated title',
			collectionId,
		})

		const updated = await asUserA.query(api.collections.get, {
			expandPath: false,
			collectionId,
		})
		expect(updated).toMatchObject({
			description: 'Original description',
			parentId,
			title: 'Updated title',
		})

		await asUserA.mutation(api.collections.update, {
			parentId: null,
			collectionId,
		})

		const withoutParent = await asUserA.query(api.collections.get, {
			expandPath: false,
			collectionId,
		})
		expect(withoutParent.parentId).toBeUndefined()
	})

	it('rejects foreign collection and parent updates', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {})
		const foreignCollectionId = await asUserB.mutation(
			api.collections.create,
			{},
		)
		const missingParentId = await asUserA.mutation(
			api.collections.create,
			{},
		)

		await asUserA.mutation(api.collections.remove, {
			collectionId: missingParentId,
		})

		await expect(
			asUserA.mutation(api.collections.update, {
				title: 'Updated',
				collectionId: foreignCollectionId,
			}),
		).rejects.toThrow('Collection not found')
		await expect(
			asUserA.mutation(api.collections.update, {
				parentId: foreignCollectionId,
				collectionId,
			}),
		).rejects.toThrow('Parent collection not found')
		await expect(
			asUserA.mutation(api.collections.update, {
				parentId: missingParentId,
				collectionId,
			}),
		).rejects.toThrow('Parent collection not found')
		await expect(
			asUserA.mutation(api.collections.remove, {
				collectionId: foreignCollectionId,
			}),
		).rejects.toThrow('Collection not found')
	})

	it('rejects self-parenting and longer parent cycles', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const childId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Child',
		})
		const grandchildId = await asUserA.mutation(api.collections.create, {
			parentId: childId,
			title: 'Grandchild',
		})

		await expect(
			asUserA.mutation(api.collections.update, {
				parentId: rootId,
				collectionId: rootId,
			}),
		).rejects.toThrow('A collection cannot be its own parent')
		await expect(
			asUserA.mutation(api.collections.update, {
				parentId: grandchildId,
				collectionId: rootId,
			}),
		).rejects.toThrow(
			'A collection cannot be nested below one of its descendants',
		)

		const root = await asUserA.query(api.collections.get, {
			expandPath: false,
			collectionId: rootId,
		})
		expect(root.parentId).toBeUndefined()
	})

	it('creates under an owned parent without validating its ancestor chain', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {})
		const parentId = await asUserA.mutation(api.collections.create, {})

		// Malformed data: a real parent link that `path` does not record.
		// `create` deliberately does not walk the chain, so it copies the
		// stale path forward rather than rejecting.
		await t.run(async ctx =>
			ctx.db.patch('collections', parentId, {
				parentId: rootId,
				path: [],
			}),
		)

		const collectionId = await asUserA.mutation(api.collections.create, {
			parentId,
		})
		const collection = await asUserA.query(api.collections.get, {
			expandPath: false,
			collectionId,
		})

		expect(collection.path).toEqual([parentId])
	})

	it('rolls back a move when malformed data hangs a foreign-owned child in the subtree', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const oldRootId = await asUserA.mutation(api.collections.create, {
			title: 'Old root',
		})
		const newRootId = await asUserA.mutation(api.collections.create, {
			title: 'New root',
		})
		const movedId = await asUserA.mutation(api.collections.create, {
			parentId: oldRootId,
			title: 'Moved',
		})
		const foreignChildId = await t.run(async ctx =>
			ctx.db.insert('collections', {
				description: '',
				ownerId: userBIdentity.subject,
				parentId: movedId,
				path: [oldRootId, movedId],
				searchText: 'Foreign child',
				title: 'Foreign child',
			}),
		)

		await expect(
			asUserA.mutation(api.collections.update, {
				parentId: newRootId,
				collectionId: movedId,
			}),
		).rejects.toThrow('Unable to move children')

		// The whole move rolls back: the mover keeps its old path and the
		// foreign document is untouched.
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: movedId,
			}),
		).resolves.toMatchObject({ parentId: oldRootId, path: [oldRootId] })
		await expect(asUserB.query(api.collections.list, {})).resolves.toEqual([
			expect.objectContaining({
				_id: foreignChildId,
				path: [oldRootId, movedId],
			}),
		])
	})

	it('recursively removes a collection subtree and leaves unrelated collections', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const childId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Child',
		})
		await asUserA.mutation(api.collections.create, {
			parentId: childId,
			title: 'Grandchild',
		})
		const unrelatedId = await asUserA.mutation(api.collections.create, {
			title: 'Unrelated',
		})

		const removed = await asUserA.mutation(api.collections.remove, {
			collectionId: rootId,
		})
		const remaining = await asUserA.query(api.collections.list, {})

		expect(removed).toMatchObject({ _id: rootId, title: 'Root' })
		expect(remaining.map(collection => collection._id)).toEqual([
			unrelatedId,
		])
	})

	it('terminates removal when malformed data contains a parent cycle', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const firstId = await asUserA.mutation(api.collections.create, {})
		const secondId = await asUserA.mutation(api.collections.create, {})
		const unrelatedId = await asUserA.mutation(api.collections.create, {})

		// Malformed data: two collections parented under each other.
		await t.run(async ctx => {
			await ctx.db.patch('collections', firstId, { parentId: secondId })
			await ctx.db.patch('collections', secondId, { parentId: firstId })
		})

		await asUserA.mutation(api.collections.remove, {
			collectionId: firstId,
		})

		const remaining = await asUserA.query(api.collections.list, {})
		expect(remaining.map(collection => collection._id)).toEqual([
			unrelatedId,
		])
	})

	it("searches title and description without leaking another owner's collections", async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const titleMatchId = await asUserA.mutation(api.collections.create, {
			title: 'Cellular biology',
		})
		const descriptionMatchId = await asUserA.mutation(
			api.collections.create,
			{
				description: 'Practice mitosis vocabulary',
				title: 'Exam prep',
			},
		)
		await asUserB.mutation(api.collections.create, {
			title: 'Cellular secrets',
		})

		const titleMatches = await asUserA.query(api.collections.search, {
			query: 'cellular',
		})
		const descriptionMatches = await asUserA.query(api.collections.search, {
			query: 'mitosis',
		})

		expect(titleMatches.map(collection => collection._id)).toEqual([
			titleMatchId,
		])
		expect(descriptionMatches.map(collection => collection._id)).toEqual([
			descriptionMatchId,
		])
		await expect(
			asUserA.query(api.collections.search, { query: '' }),
		).resolves.toEqual([])
		await expect(
			asUserA.query(api.collections.search, { query: '   ' }),
		).resolves.toEqual([])
	})

	it('keeps collection search text synchronized through updates and deletion', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const collectionId = await asUserA.mutation(api.collections.create, {
			description: 'Original description',
			title: 'Oldname',
		})

		await asUserA.mutation(api.collections.update, {
			title: 'Newname',
			collectionId,
		})

		await expect(
			asUserA.query(api.collections.search, { query: 'Oldname' }),
		).resolves.toEqual([])
		await expect(
			asUserA.query(api.collections.search, { query: 'Newname' }),
		).resolves.toMatchObject([{ _id: collectionId }])

		await asUserA.mutation(api.collections.remove, { collectionId })
		await expect(
			asUserA.query(api.collections.search, { query: 'Newname' }),
		).resolves.toEqual([])
	})

	it('returns a root-first ancestor path for search hits, excluding the hit itself', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Math',
		})
		const parentId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Calculus',
		})
		await asUserA.mutation(api.collections.create, {
			parentId,
			title: 'Derivatives',
		})

		await expect(
			asUserA.query(api.collections.search, { query: 'Derivatives' }),
		).resolves.toMatchObject([
			{ pathTitles: ['Math', 'Calculus'], title: 'Derivatives' },
		])
		await expect(
			asUserA.query(api.collections.search, { query: 'Math' }),
		).resolves.toMatchObject([{ pathTitles: [], title: 'Math' }])
	})

	it('resolves paths for hits sharing ancestors without changing relevance order', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Science',
		})
		const firstId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Biology basics',
		})
		const secondId = await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Biology advanced',
		})

		const results = await asUserA.query(api.collections.search, {
			query: 'Biology',
		})

		expect(results.map(result => result._id)).toEqual([firstId, secondId])
		expect(results.every(result => result.pathTitles.length === 1)).toBe(
			true,
		)
	})

	it('reflects an ancestor rename in the next search result without rewriting descendants', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Old root name',
		})
		await asUserA.mutation(api.collections.create, {
			parentId: rootId,
			title: 'Child',
		})

		await asUserA.mutation(api.collections.update, {
			title: 'New root name',
			collectionId: rootId,
		})

		await expect(
			asUserA.query(api.collections.search, { query: 'Child' }),
		).resolves.toMatchObject([{ pathTitles: ['New root name'] }])
	})

	it('reflects a reparent in the next search result path', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const oldRootId = await asUserA.mutation(api.collections.create, {
			title: 'Old root',
		})
		const newRootId = await asUserA.mutation(api.collections.create, {
			title: 'New root',
		})
		const movedId = await asUserA.mutation(api.collections.create, {
			parentId: oldRootId,
			title: 'Moved',
		})

		await asUserA.mutation(api.collections.update, {
			parentId: newRootId,
			collectionId: movedId,
		})

		await expect(
			asUserA.query(api.collections.search, { query: 'Moved' }),
		).resolves.toMatchObject([{ pathTitles: ['New root'] }])
	})

	it('drops a foreign-owned ancestor from a search hit path', async () => {
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
			title: 'Findme',
		})

		// Malformed data: an owned search hit references another user's collection in
		// its server-owned path. Search must not expose that collection's title.
		await t.run(async ctx => {
			await ctx.db.patch('collections', collectionId, {
				path: [foreignCollectionId],
			})
		})

		await expect(
			asUserA.query(api.collections.search, { query: 'Findme' }),
		).resolves.toMatchObject([{ pathTitles: [] }])
	})

	it('rolls back removal when malformed data contains a foreign-owned child', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const rootId = await asUserA.mutation(api.collections.create, {
			title: 'Root',
		})
		const foreignChildId = await t.run(async ctx =>
			ctx.db.insert('collections', {
				description: '',
				ownerId: userBIdentity.subject,
				parentId: rootId,
				path: [rootId],
				searchText: 'Foreign child',
				title: 'Foreign child',
			}),
		)

		await expect(
			asUserA.mutation(api.collections.remove, { collectionId: rootId }),
		).rejects.toThrow('Unable to delete children')
		await expect(
			asUserA.query(api.collections.get, {
				expandPath: false,
				collectionId: rootId,
			}),
		).resolves.toMatchObject({ title: 'Root' })
		await expect(asUserB.query(api.collections.list, {})).resolves.toEqual([
			expect.objectContaining({ _id: foreignChildId }),
		])
	})
})
