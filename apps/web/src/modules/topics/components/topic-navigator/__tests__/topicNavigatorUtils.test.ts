import { describe, expect, it } from 'vitest'

import {
	canReparentTopic,
	createRootDropId,
	createTopicDropId,
	parseTopicDropId,
} from '../topicNavigatorUtils'

const topicTreeNodes = [
	{
		id: 1,
		title: 'Algebra',
		body: '',
		parentId: null,
		parentTitle: null,
		insertedAt: '',
		updatedAt: '',
		children: [],
	},
	{
		id: 2,
		title: 'Linear equations',
		body: '',
		parentId: 1,
		parentTitle: 'Algebra',
		insertedAt: '',
		updatedAt: '',
		children: [],
	},
	{
		id: 3,
		title: 'Systems',
		body: '',
		parentId: 2,
		parentTitle: 'Linear equations',
		insertedAt: '',
		updatedAt: '',
		children: [],
	},
	{
		id: 4,
		title: 'Geometry',
		body: '',
		parentId: null,
		parentTitle: null,
		insertedAt: '',
		updatedAt: '',
		children: [],
	},
]

describe('topicNavigatorUtils', () => {
	it('parses topic and root drop ids', () => {
		expect(parseTopicDropId(createTopicDropId(12))).toEqual({
			type: 'topic',
			topicId: 12,
		})
		expect(parseTopicDropId(createRootDropId('top'))).toEqual({
			type: 'root',
		})
		expect(parseTopicDropId(createRootDropId('bottom'))).toEqual({
			type: 'root',
		})
	})

	it('blocks invalid reparent targets and allows valid ones', () => {
		const nodeById = new Map(topicTreeNodes.map(node => [node.id, node]))
		const ancestorIdsById = new Map<number, Array<number>>([
			[1, []],
			[2, [1]],
			[3, [1, 2]],
			[4, []],
		])

		expect(
			canReparentTopic({
				draggedTopicId: 2,
				nextParentId: 2,
				ancestorIdsById,
				nodeById,
			}),
		).toBe(false)

		expect(
			canReparentTopic({
				draggedTopicId: 2,
				nextParentId: 1,
				ancestorIdsById,
				nodeById,
			}),
		).toBe(false)

		expect(
			canReparentTopic({
				draggedTopicId: 2,
				nextParentId: 3,
				ancestorIdsById,
				nodeById,
			}),
		).toBe(false)

		expect(
			canReparentTopic({
				draggedTopicId: 2,
				nextParentId: 4,
				ancestorIdsById,
				nodeById,
			}),
		).toBe(true)

		expect(
			canReparentTopic({
				draggedTopicId: 2,
				nextParentId: null,
				ancestorIdsById,
				nodeById,
			}),
		).toBe(true)
	})
})
