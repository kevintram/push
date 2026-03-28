import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import { useTopicDetailOutline } from '../useTopicDetailOutline'

vi.mock('~/features/topics/hooks/useTopicTreeActions', () => ({
	useTopicTreeActions: () => ({
		handleConfirmDeleteTopic: vi.fn(),
		handleCreateSubtopic: vi.fn(),
		handleDialogOpenChange: vi.fn(),
		isCreatingTopic: false,
		isDeletingTopic: false,
		pendingDeleteTopic: null,
		pendingDeleteTopicId: null,
		setPendingDeleteTopicId: vi.fn()
	})
}))

function createTopicNode({
	children = [],
	id,
	parentId,
	title
}: {
	children?: Array<TopicTreeNode>
	id: number
	parentId: number | null
	title: string
}): TopicTreeNode {
	return {
		body: '',
		children,
		id,
		inserted_at: '2025-01-01T00:00:00.000Z',
		parent_id: parentId,
		parent_title: null,
		title,
		updated_at: '2025-01-01T00:00:00.000Z'
	}
}

function buildOutlineTree() {
	const grandchild = createTopicNode({
		id: 3,
		parentId: 2,
		title: 'Grandchild'
	})
	const collapsibleChild = createTopicNode({
		children: [grandchild],
		id: 2,
		parentId: 1,
		title: 'Collapsible Child'
	})
	const leafChild = createTopicNode({
		id: 4,
		parentId: 1,
		title: 'Leaf Child'
	})
	const root = createTopicNode({
		children: [collapsibleChild, leafChild],
		id: 1,
		parentId: null,
		title: 'Root'
	})
	const nodeById = new Map<number, TopicTreeNode>([
		[root.id, root],
		[collapsibleChild.id, collapsibleChild],
		[grandchild.id, grandchild],
		[leafChild.id, leafChild]
	])
	const ancestorIdsById = new Map<number, Array<number>>([
		[root.id, []],
		[collapsibleChild.id, [root.id]],
		[grandchild.id, [root.id, collapsibleChild.id]],
		[leafChild.id, [root.id]]
	])

	return {
		ancestorIdsById,
		collapsibleChild,
		nodeById,
		outlineRootNode: root
	}
}

describe('useTopicDetailOutline', () => {
	it('expands collapsible outline topics on first render', () => {
		const initialTree = buildOutlineTree()
		const { result } = renderHook(() =>
			useTopicDetailOutline({
				ancestorIdsById: initialTree.ancestorIdsById,
				nodeById: initialTree.nodeById,
				outlineRootNode: initialTree.outlineRootNode,
				visibleSectionIds: []
			})
		)

		expect(
			result.current.expandedIdSet.has(initialTree.collapsibleChild.id)
		).toBe(true)
	})

	it('preserves manual collapse state when the same root topic refetches', async () => {
		const initialTree = buildOutlineTree()
		const { result, rerender } = renderHook(
			({
				ancestorIdsById,
				nodeById,
				outlineRootNode
			}: {
				ancestorIdsById: Map<number, Array<number>>
				nodeById: Map<number, TopicTreeNode>
				outlineRootNode: TopicTreeNode
			}) =>
				useTopicDetailOutline({
					ancestorIdsById,
					nodeById,
					outlineRootNode,
					visibleSectionIds: []
				}),
			{
				initialProps: {
					ancestorIdsById: initialTree.ancestorIdsById,
					nodeById: initialTree.nodeById,
					outlineRootNode: initialTree.outlineRootNode
				}
			}
		)

		await waitFor(() => {
			expect(
				result.current.expandedIdSet.has(initialTree.collapsibleChild.id)
			).toBe(true)
		})

		act(() => {
			result.current.toggleExpanded(initialTree.collapsibleChild.id)
		})

		expect(
			result.current.expandedIdSet.has(initialTree.collapsibleChild.id)
		).toBe(false)

		const refetchedTree = buildOutlineTree()
		rerender({
			ancestorIdsById: refetchedTree.ancestorIdsById,
			nodeById: refetchedTree.nodeById,
			outlineRootNode: refetchedTree.outlineRootNode
		})

		await waitFor(() => {
			expect(
				result.current.expandedIdSet.has(refetchedTree.collapsibleChild.id)
			).toBe(false)
		})
	})
})
