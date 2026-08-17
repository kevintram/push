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
			}),
		)

		await expect(t.query(api.topics.list, {})).rejects.toThrow(
			'Unauthenticated',
		)
		await expect(t.query(api.topics.get, { topicId })).rejects.toThrow(
			'Unauthenticated',
		)
		await expect(
			t.query(api.topics.ancestorsOf, { includeSelf: false, topicId }),
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

	it('lists ancestors from the root down to the immediate parent', async () => {
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
			asUserA.query(api.topics.ancestorsOf, {
				includeSelf: false,
				topicId: rootId,
			}),
		).resolves.toEqual([])

		const ancestors = await asUserA.query(api.topics.ancestorsOf, {
			includeSelf: false,
			topicId,
		})
		expect(ancestors.map(ancestor => ancestor._id)).toEqual([
			rootId,
			parentId,
		])

		const path = await asUserA.query(api.topics.ancestorsOf, {
			includeSelf: true,
			topicId,
		})
		expect(path.map(pathTopic => pathTopic._id)).toEqual([
			rootId,
			parentId,
			topicId,
		])
	})

	it('hides missing and foreign-owned topics when listing ancestors', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const foreignTopicId = await asUserB.mutation(api.topics.create, {})
		const missingTopicId = await asUserA.mutation(api.topics.create, {})

		await asUserA.mutation(api.topics.remove, { topicId: missingTopicId })

		await expect(
			asUserA.query(api.topics.ancestorsOf, {
				includeSelf: false,
				topicId: foreignTopicId,
			}),
		).rejects.toThrow('Topic not found')
		await expect(
			asUserA.query(api.topics.ancestorsOf, {
				includeSelf: false,
				topicId: missingTopicId,
			}),
		).rejects.toThrow('Topic not found')
	})

	it('rejects malformed ancestor chains', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const foreignRootId = await asUserB.mutation(api.topics.create, {})
		const parentId = await asUserA.mutation(api.topics.create, {})
		const topicId = await asUserA.mutation(api.topics.create, {
			parentId,
		})

		await t.run(async ctx =>
			ctx.db.patch('topics', parentId, { parentId: foreignRootId }),
		)
		await expect(
			asUserA.query(api.topics.ancestorsOf, {
				includeSelf: false,
				topicId,
			}),
		).rejects.toThrow('Parent topic not found')

		await t.run(async ctx =>
			ctx.db.patch('topics', parentId, { parentId: topicId }),
		)
		await expect(
			asUserA.query(api.topics.ancestorsOf, {
				includeSelf: false,
				topicId,
			}),
		).rejects.toThrow('Parent topic hierarchy contains a cycle')
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
			asUserA.query(api.topics.get, { topicId: defaultTopicId }),
		).resolves.toMatchObject({
			description: '',
			ownerId: userAIdentity.subject,
			title: '',
		})
		await expect(
			asUserA.query(api.topics.get, { topicId: childId }),
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
			asUserA.query(api.topics.get, { topicId: ownedTopicId }),
		).resolves.toMatchObject({ title: 'Owned' })
		await expect(
			asUserA.query(api.topics.get, { topicId: foreignTopicId }),
		).rejects.toThrow('Topic not found')
		await expect(
			asUserA.query(api.topics.get, { topicId: missingTopicId }),
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

		const updated = await asUserA.query(api.topics.get, { topicId })
		expect(updated).toMatchObject({
			description: 'Original description',
			parentId,
			title: 'Updated title',
		})

		await asUserA.mutation(api.topics.update, { parentId: null, topicId })

		const withoutParent = await asUserA.query(api.topics.get, { topicId })
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

		const root = await asUserA.query(api.topics.get, { topicId: rootId })
		expect(root.parentId).toBeUndefined()
	})

	it('rejects a parent whose own ancestors are foreign-owned', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const asUserB = t.withIdentity(userBIdentity)
		const foreignRootId = await asUserB.mutation(api.topics.create, {})
		const parentId = await asUserA.mutation(api.topics.create, {})

		// Malformed data: an owned topic parented under a foreign-owned one.
		await t.run(async ctx =>
			ctx.db.patch('topics', parentId, { parentId: foreignRootId }),
		)

		await expect(
			asUserA.mutation(api.topics.create, { parentId }),
		).rejects.toThrow('Parent topic not found')
	})

	it('rejects a parent chain that already contains a cycle', async () => {
		const t = convexTest(schema, modules)
		const asUserA = t.withIdentity(userAIdentity)
		const firstId = await asUserA.mutation(api.topics.create, {})
		const secondId = await asUserA.mutation(api.topics.create, {})
		const topicId = await asUserA.mutation(api.topics.create, {})

		// Malformed data: two topics parented under each other.
		await t.run(async ctx => {
			await ctx.db.patch('topics', firstId, { parentId: secondId })
			await ctx.db.patch('topics', secondId, { parentId: firstId })
		})

		await expect(
			asUserA.mutation(api.topics.update, { parentId: firstId, topicId }),
		).rejects.toThrow('Parent topic hierarchy contains a cycle')
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
				title: 'Foreign child',
			}),
		)

		await expect(
			asUserA.mutation(api.topics.remove, { topicId: rootId }),
		).rejects.toThrow('Unable to delete children')
		await expect(
			asUserA.query(api.topics.get, { topicId: rootId }),
		).resolves.toMatchObject({ title: 'Root' })
		await expect(asUserB.query(api.topics.list, {})).resolves.toEqual([
			expect.objectContaining({ _id: foreignChildId }),
		])
	})
})
