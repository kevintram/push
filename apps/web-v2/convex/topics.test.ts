import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

const userAIdentity = { subject: 'user-a' }
const userBIdentity = { subject: 'user-b' }

describe('topics', () => {
	it('requires authentication for every public function', async () => {
		const t = convexTest(schema, modules)
		const topicId = await t.run(async ctx =>
			ctx.db.insert('topics', {
				title: 'Topic',
				description: '',
				ownerId: userAIdentity.subject,
				path: [],
				searchText: 'Topic',
			}),
		)

		await expect(t.query(api.topics.list, {})).rejects.toThrow(
			'Unauthenticated',
		)
		await expect(
			t.query(api.topics.get, { expandPath: false, topicId }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.query(api.topics.get, { expandPath: true, topicId }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.query(api.topics.search, { query: 'Topic' }),
		).rejects.toThrow('Unauthenticated')
		await expect(t.mutation(api.topics.create, {})).rejects.toThrow(
			'Unauthenticated',
		)
		await expect(
			t.mutation(api.topics.update, { topicId, title: 'Updated' }),
		).rejects.toThrow('Unauthenticated')
		await expect(
			t.mutation(api.topics.remove, { topicId }),
		).rejects.toThrow('Unauthenticated')
	})

	it('stores the ancestor chain on each topic, root-first and excluding self', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const parentId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Parent',
		})
		const topicId = await asUserA.mutation(api.topics.create, {
			parentId,
			title: 'Topic',
		})

		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: rootId,
			}),
		).resolves.toMatchObject({ path: [] })
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: parentId,
			}),
		).resolves.toMatchObject({ path: [rootId] })
		await expect(
			asUserA.query(api.topics.get, { expandPath: false, topicId }),
		).resolves.toMatchObject({ path: [rootId, parentId] })
	})

	it('rewrites the paths of every descendant when a mid-tree topic moves', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const oldRootId = await asUserA.mutation(api.topics.create, {
			title: 'Old root',
		})
		const newRootId = await asUserA.mutation(api.topics.create, {
			title: 'New root',
		})
		const movedId = await asUserA.mutation(api.topics.create, {
			parentId: oldRootId,
			title: 'Moved',
		})
		const childId = await asUserA.mutation(api.topics.create, {
			parentId: movedId,
			title: 'Child',
		})
		const grandchildId = await asUserA.mutation(api.topics.create, {
			parentId: childId,
			title: 'Grandchild',
		})

		await asUserA.mutation(api.topics.update, {
			parentId: newRootId,
			topicId: movedId,
		})

		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: movedId,
			}),
		).resolves.toMatchObject({ path: [newRootId] })
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: childId,
			}),
		).resolves.toMatchObject({ path: [newRootId, movedId] })
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: grandchildId,
			}),
		).resolves.toMatchObject({ path: [newRootId, movedId, childId] })
	})

	it('empties the path and rewrites descendants when a topic detaches to the root', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const movedId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Moved',
		})
		const childId = await asUserA.mutation(api.topics.create, {
			parentId: movedId,
			title: 'Child',
		})

		await asUserA.mutation(api.topics.update, {
			parentId: null,
			topicId: movedId,
		})

		const moved = await asUserA.query(api.topics.get, {
			expandPath: false,
			topicId: movedId,
		})
		expect(moved.parentId).toBeUndefined()
		expect(moved.path).toEqual([])
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: childId,
			}),
		).resolves.toMatchObject({ path: [movedId] })
	})

	it('leaves the path untouched when an update does not move the topic', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const topicId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Topic',
		})

		await asUserA.mutation(api.topics.update, {
			title: 'Renamed',
			topicId,
		})

		await expect(
			asUserA.query(api.topics.get, { expandPath: false, topicId }),
		).resolves.toMatchObject({ path: [rootId], title: 'Renamed' })
	})

	it('does not inspect or rewrite paths when a re-save names the same parent', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const topicId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Topic',
		})
		const childId = await asUserA.mutation(api.topics.create, {
			parentId: topicId,
			title: 'Child',
		})

		// Path integrity is maintained by hierarchy mutations, not audited by
		// unrelated updates or a no-op parent assignment.
		await t.run(async ctx => {
			await ctx.db.patch('topics', topicId, { path: [] })
			await ctx.db.patch('topics', childId, { path: [topicId] })
		})

		await asUserA.mutation(api.topics.update, {
			parentId: rootId,
			title: 'Renamed',
			topicId,
		})

		await expect(
			asUserA.query(api.topics.get, { expandPath: false, topicId }),
		).resolves.toMatchObject({
			parentId: rootId,
			path: [],
			title: 'Renamed',
		})
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: childId,
			}),
		).resolves.toMatchObject({ path: [topicId] })
	})

	it('expands the ancestor chain root-first, excluding the topic itself', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const parentId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Parent',
		})
		const topicId = await asUserA.mutation(api.topics.create, {
			parentId,
			title: 'Topic',
		})

		await expect(
			asUserA.query(api.topics.get, { expandPath: true, topicId }),
		).resolves.toMatchObject({
			path: [{ title: 'Root' }, { title: 'Parent' }],
			title: 'Topic',
		})
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: true,
				topicId: rootId,
			}),
		).resolves.toMatchObject({ path: [], title: 'Root' })
	})

	it('leaves the ancestor chain as ids when expandPath is false', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const topicId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Topic',
		})

		await expect(
			asUserA.query(api.topics.get, { expandPath: false, topicId }),
		).resolves.toMatchObject({ path: [rootId], title: 'Topic' })
	})

	it('follows a reparent when expanding ancestors', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const oldParentId = await asUserA.mutation(api.topics.create, {
			title: 'Old parent',
		})
		const newParentId = await asUserA.mutation(api.topics.create, {
			title: 'New parent',
		})
		const topicId = await asUserA.mutation(api.topics.create, {
			parentId: oldParentId,
			title: 'Topic',
		})

		await asUserA.mutation(api.topics.update, {
			parentId: newParentId,
			topicId,
		})

		await expect(
			asUserA.query(api.topics.get, { expandPath: true, topicId }),
		).resolves.toMatchObject({ path: [{ title: 'New parent' }] })
	})

	it('drops ancestors that no longer resolve rather than throwing', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const topicId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Topic',
		})

		// Delete the ancestor out from under the stored `path` without the
		// cascade that keeps the two consistent, so the read is torn the way a
		// concurrent removal would leave it.
		await t.run(async ctx => {
			await ctx.db.delete('topics', rootId)
		})

		await expect(
			asUserA.query(api.topics.get, { expandPath: true, topicId }),
		).resolves.toMatchObject({ path: [], title: 'Topic' })
	})

	it('refuses to expand ancestors for a topic owned by another user', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const topicId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Topic',
		})

		await expect(
			asUserB.query(api.topics.get, { expandPath: true, topicId }),
		).rejects.toThrow('Topic not found')
	})

	it('lists only topics owned by the authenticated user', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)

		await asUserA.mutation(api.topics.create, { title: 'A1' })
		await asUserA.mutation(api.topics.create, { title: 'A2' })
		await asUserB.mutation(api.topics.create, { title: 'B1' })

		const topics = await asUserA.query(api.topics.list, {})

		expect(topics).toHaveLength(2)
		expect(topics.map(topic => topic.title)).toEqual(['A1', 'A2'])
		expect(
			topics.every(topic => topic.ownerId === userAIdentity.subject),
		).toBe(true)
	})

	it('creates topics with defaults and supplied parent fields', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const parentId = await asUserA.mutation(api.topics.create, {
			title: 'Parent',
		})

		const defaultTopicId = await asUserA.mutation(api.topics.create, {})
		const childId = await asUserA.mutation(api.topics.create, {
			description: 'Description',
			parentId,
			title: 'Child',
		})

		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: defaultTopicId,
			}),
		).resolves.toMatchObject({
			description: '',
			ownerId: userAIdentity.subject,
			title: '',
		})
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: childId,
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
		const missingParentId = await asUserA.mutation(api.topics.create, {})
		const foreignParentId = await asUserB.mutation(api.topics.create, {})

		await asUserA.mutation(api.topics.remove, { topicId: missingParentId })

		await expect(
			asUserA.mutation(api.topics.create, { parentId: missingParentId }),
		).rejects.toThrow('Parent topic not found')
		await expect(
			asUserA.mutation(api.topics.create, { parentId: foreignParentId }),
		).rejects.toThrow('Parent topic not found')
	})

	it('gets owned topics while hiding missing and foreign-owned topics', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const ownedTopicId = await asUserA.mutation(api.topics.create, {
			title: 'Owned',
		})
		const foreignTopicId = await asUserB.mutation(api.topics.create, {})
		const missingTopicId = await asUserA.mutation(api.topics.create, {})

		await asUserA.mutation(api.topics.remove, { topicId: missingTopicId })

		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: ownedTopicId,
			}),
		).resolves.toMatchObject({ title: 'Owned' })
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: foreignTopicId,
			}),
		).rejects.toThrow('Topic not found')
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: missingTopicId,
			}),
		).rejects.toThrow('Topic not found')
	})

	it('patches supplied fields and can assign or unset a parent', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const parentId = await asUserA.mutation(api.topics.create, {})
		const topicId = await asUserA.mutation(api.topics.create, {
			description: 'Original description',
			title: 'Original title',
		})

		await asUserA.mutation(api.topics.update, {
			parentId,
			title: 'Updated title',
			topicId,
		})

		const updated = await asUserA.query(api.topics.get, {
			expandPath: false,
			topicId,
		})
		expect(updated).toMatchObject({
			description: 'Original description',
			parentId,
			title: 'Updated title',
		})

		await asUserA.mutation(api.topics.update, { parentId: null, topicId })

		const withoutParent = await asUserA.query(api.topics.get, {
			expandPath: false,
			topicId,
		})
		expect(withoutParent.parentId).toBeUndefined()
	})

	it('rejects foreign topic and parent updates', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {})
		const foreignTopicId = await asUserB.mutation(api.topics.create, {})
		const missingParentId = await asUserA.mutation(api.topics.create, {})

		await asUserA.mutation(api.topics.remove, { topicId: missingParentId })

		await expect(
			asUserA.mutation(api.topics.update, {
				title: 'Updated',
				topicId: foreignTopicId,
			}),
		).rejects.toThrow('Topic not found')
		await expect(
			asUserA.mutation(api.topics.update, {
				parentId: foreignTopicId,
				topicId,
			}),
		).rejects.toThrow('Parent topic not found')
		await expect(
			asUserA.mutation(api.topics.update, {
				parentId: missingParentId,
				topicId,
			}),
		).rejects.toThrow('Parent topic not found')
		await expect(
			asUserA.mutation(api.topics.remove, { topicId: foreignTopicId }),
		).rejects.toThrow('Topic not found')
	})

	it('rejects self-parenting and longer parent cycles', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const childId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Child',
		})
		const grandchildId = await asUserA.mutation(api.topics.create, {
			parentId: childId,
			title: 'Grandchild',
		})

		await expect(
			asUserA.mutation(api.topics.update, {
				parentId: rootId,
				topicId: rootId,
			}),
		).rejects.toThrow('A topic cannot be its own parent')
		await expect(
			asUserA.mutation(api.topics.update, {
				parentId: grandchildId,
				topicId: rootId,
			}),
		).rejects.toThrow(
			'A topic cannot be nested below one of its descendants',
		)

		const root = await asUserA.query(api.topics.get, {
			expandPath: false,
			topicId: rootId,
		})
		expect(root.parentId).toBeUndefined()
	})

	it('creates under an owned parent without validating its ancestor chain', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {})
		const parentId = await asUserA.mutation(api.topics.create, {})

		// Malformed data: a real parent link that `path` does not record.
		// `create` deliberately does not walk the chain, so it copies the
		// stale path forward rather than rejecting.
		await t.run(async ctx =>
			ctx.db.patch('topics', parentId, { parentId: rootId, path: [] }),
		)

		const topicId = await asUserA.mutation(api.topics.create, { parentId })
		const topic = await asUserA.query(api.topics.get, {
			expandPath: false,
			topicId,
		})

		expect(topic.path).toEqual([parentId])
	})

	it('rolls back a move when malformed data hangs a foreign-owned child in the subtree', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const oldRootId = await asUserA.mutation(api.topics.create, {
			title: 'Old root',
		})
		const newRootId = await asUserA.mutation(api.topics.create, {
			title: 'New root',
		})
		const movedId = await asUserA.mutation(api.topics.create, {
			parentId: oldRootId,
			title: 'Moved',
		})
		const foreignChildId = await t.run(async ctx =>
			ctx.db.insert('topics', {
				description: '',
				ownerId: userBIdentity.subject,
				parentId: movedId,
				path: [oldRootId, movedId],
				searchText: 'Foreign child',
				title: 'Foreign child',
			}),
		)

		await expect(
			asUserA.mutation(api.topics.update, {
				parentId: newRootId,
				topicId: movedId,
			}),
		).rejects.toThrow('Unable to move children')

		// The whole move rolls back: the mover keeps its old path and the
		// foreign document is untouched.
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: movedId,
			}),
		).resolves.toMatchObject({ parentId: oldRootId, path: [oldRootId] })
		await expect(asUserB.query(api.topics.list, {})).resolves.toEqual([
			expect.objectContaining({
				_id: foreignChildId,
				path: [oldRootId, movedId],
			}),
		])
	})

	it('recursively removes a topic subtree and leaves unrelated topics', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const childId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Child',
		})
		await asUserA.mutation(api.topics.create, {
			parentId: childId,
			title: 'Grandchild',
		})
		const unrelatedId = await asUserA.mutation(api.topics.create, {
			title: 'Unrelated',
		})

		const removed = await asUserA.mutation(api.topics.remove, {
			topicId: rootId,
		})
		const remaining = await asUserA.query(api.topics.list, {})

		expect(removed).toMatchObject({ _id: rootId, title: 'Root' })
		expect(remaining.map(topic => topic._id)).toEqual([unrelatedId])
	})

	it('terminates removal when malformed data contains a parent cycle', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const firstId = await asUserA.mutation(api.topics.create, {})
		const secondId = await asUserA.mutation(api.topics.create, {})
		const unrelatedId = await asUserA.mutation(api.topics.create, {})

		// Malformed data: two topics parented under each other.
		await t.run(async ctx => {
			await ctx.db.patch('topics', firstId, { parentId: secondId })
			await ctx.db.patch('topics', secondId, { parentId: firstId })
		})

		await asUserA.mutation(api.topics.remove, { topicId: firstId })

		const remaining = await asUserA.query(api.topics.list, {})
		expect(remaining.map(topic => topic._id)).toEqual([unrelatedId])
	})

	it("searches title and description without leaking another owner's topics", async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const titleMatchId = await asUserA.mutation(api.topics.create, {
			title: 'Cellular biology',
		})
		const descriptionMatchId = await asUserA.mutation(api.topics.create, {
			description: 'Practice mitosis vocabulary',
			title: 'Exam prep',
		})
		await asUserB.mutation(api.topics.create, {
			title: 'Cellular secrets',
		})

		const titleMatches = await asUserA.query(api.topics.search, {
			query: 'cellular',
		})
		const descriptionMatches = await asUserA.query(api.topics.search, {
			query: 'mitosis',
		})

		expect(titleMatches.map(topic => topic._id)).toEqual([titleMatchId])
		expect(descriptionMatches.map(topic => topic._id)).toEqual([
			descriptionMatchId,
		])
		await expect(
			asUserA.query(api.topics.search, { query: '' }),
		).resolves.toEqual([])
		await expect(
			asUserA.query(api.topics.search, { query: '   ' }),
		).resolves.toEqual([])
	})

	it('keeps topic search text synchronized through updates and deletion', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const topicId = await asUserA.mutation(api.topics.create, {
			description: 'Original description',
			title: 'Oldname',
		})

		await asUserA.mutation(api.topics.update, {
			title: 'Newname',
			topicId,
		})

		await expect(
			asUserA.query(api.topics.search, { query: 'Oldname' }),
		).resolves.toEqual([])
		await expect(
			asUserA.query(api.topics.search, { query: 'Newname' }),
		).resolves.toMatchObject([{ _id: topicId }])

		await asUserA.mutation(api.topics.remove, { topicId })
		await expect(
			asUserA.query(api.topics.search, { query: 'Newname' }),
		).resolves.toEqual([])
	})

	it('returns a root-first ancestor path for search hits, excluding the hit itself', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Math',
		})
		const parentId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Calculus',
		})
		await asUserA.mutation(api.topics.create, {
			parentId,
			title: 'Derivatives',
		})

		await expect(
			asUserA.query(api.topics.search, { query: 'Derivatives' }),
		).resolves.toMatchObject([
			{ pathTitles: ['Math', 'Calculus'], title: 'Derivatives' },
		])
		await expect(
			asUserA.query(api.topics.search, { query: 'Math' }),
		).resolves.toMatchObject([{ pathTitles: [], title: 'Math' }])
	})

	it('resolves paths for hits sharing ancestors without changing relevance order', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Science',
		})
		const firstId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Biology basics',
		})
		const secondId = await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Biology advanced',
		})

		const results = await asUserA.query(api.topics.search, {
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
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Old root name',
		})
		await asUserA.mutation(api.topics.create, {
			parentId: rootId,
			title: 'Child',
		})

		await asUserA.mutation(api.topics.update, {
			title: 'New root name',
			topicId: rootId,
		})

		await expect(
			asUserA.query(api.topics.search, { query: 'Child' }),
		).resolves.toMatchObject([{ pathTitles: ['New root name'] }])
	})

	it('reflects a reparent in the next search result path', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const oldRootId = await asUserA.mutation(api.topics.create, {
			title: 'Old root',
		})
		const newRootId = await asUserA.mutation(api.topics.create, {
			title: 'New root',
		})
		const movedId = await asUserA.mutation(api.topics.create, {
			parentId: oldRootId,
			title: 'Moved',
		})

		await asUserA.mutation(api.topics.update, {
			parentId: newRootId,
			topicId: movedId,
		})

		await expect(
			asUserA.query(api.topics.search, { query: 'Moved' }),
		).resolves.toMatchObject([{ pathTitles: ['New root'] }])
	})

	it('drops a foreign-owned ancestor from a search hit path', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const foreignTopicId = await asUserB.mutation(api.topics.create, {
			title: 'Foreign secret',
		})
		const topicId = await asUserA.mutation(api.topics.create, {
			title: 'Findme',
		})

		// Malformed data: an owned search hit references another user's topic in
		// its server-owned path. Search must not expose that topic's title.
		await t.run(async ctx => {
			await ctx.db.patch('topics', topicId, { path: [foreignTopicId] })
		})

		await expect(
			asUserA.query(api.topics.search, { query: 'Findme' }),
		).resolves.toMatchObject([{ pathTitles: [] }])
	})

	it('rolls back removal when malformed data contains a foreign-owned child', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const rootId = await asUserA.mutation(api.topics.create, {
			title: 'Root',
		})
		const foreignChildId = await t.run(async ctx =>
			ctx.db.insert('topics', {
				description: '',
				ownerId: userBIdentity.subject,
				parentId: rootId,
				path: [rootId],
				searchText: 'Foreign child',
				title: 'Foreign child',
			}),
		)

		await expect(
			asUserA.mutation(api.topics.remove, { topicId: rootId }),
		).rejects.toThrow('Unable to delete children')
		await expect(
			asUserA.query(api.topics.get, {
				expandPath: false,
				topicId: rootId,
			}),
		).resolves.toMatchObject({ title: 'Root' })
		await expect(asUserB.query(api.topics.list, {})).resolves.toEqual([
			expect.objectContaining({ _id: foreignChildId }),
		])
	})
})
