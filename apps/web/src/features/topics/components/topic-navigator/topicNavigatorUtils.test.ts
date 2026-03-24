import { describe, expect, it } from 'vitest'
import {
	canReparentTopic,
	createRootDropId,
	createTopicDropId,
	parseTopicDropId
} from './topicNavigatorUtils'

const topicTreeNodes = [
	{
		id: 1,
		title: 'Algebra',
		body: '',
		parent_id: null,
		parent_title: null,
		inserted_at: '',
		updated_at: '',
		children: []
	},
	{
		id: 2,
		title: 'Linear equations',
		body: '',
		parent_id: 1,
		parent_title: 'Algebra',
		inserted_at: '',
		updated_at: '',
		children: []
	},
	{
		id: 3,
		title: 'Systems',
		body: '',
		parent_id: 2,
		parent_title: 'Linear equations',
		inserted_at: '',
		updated_at: '',
		children: []
	},
	{
		id: 4,
		title: 'Geometry',
		body: '',
		parent_id: null,
		parent_title: null,
		inserted_at: '',
		updated_at: '',
		children: []
	}
]

// biome-ignore lint/security/noSecrets: Test suite label is not a secret.
describe('topicNavigatorUtils', () => {
	it('parses topic and root drop ids', () => {
		expect(parseTopicDropId(createTopicDropId(12))).toEqual({
			type: 'topic',
			topicId: 12
		})
		expect(parseTopicDropId(createRootDropId('top'))).toEqual({
			type: 'root'
		})
		expect(parseTopicDropId(createRootDropId('bottom'))).toEqual({
			type: 'root'
		})
	})

	it('blocks invalid reparent targets and allows valid ones', () => {
		const nodeById = new Map(topicTreeNodes.map(node => [node.id, node]))
		const ancestorIdsById = new Map<number, Array<number>>([
			[1, []],
			[2, [1]],
			[3, [1, 2]],
			[4, []]
		])

		expect(
			canReparentTopic({
				draggedTopicId: 2,
				nextParentId: 2,
				ancestorIdsById,
				nodeById
			})
		).toBe(false)

		expect(
			canReparentTopic({
				draggedTopicId: 2,
				nextParentId: 1,
				ancestorIdsById,
				nodeById
			})
		).toBe(false)

		expect(
			canReparentTopic({
				draggedTopicId: 2,
				nextParentId: 3,
				ancestorIdsById,
				nodeById
			})
		).toBe(false)

		expect(
			canReparentTopic({
				draggedTopicId: 2,
				nextParentId: 4,
				ancestorIdsById,
				nodeById
			})
		).toBe(true)

		expect(
			canReparentTopic({
				draggedTopicId: 2,
				nextParentId: null,
				ancestorIdsById,
				nodeById
			})
		).toBe(true)
	})
})
