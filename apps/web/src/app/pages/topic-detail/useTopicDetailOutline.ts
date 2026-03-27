import { useEffect, useMemo, useRef, useState } from 'react'
import { useTopicTreeActions } from '~/features/topics/hooks/useTopicTreeActions'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'

type UseTopicDetailOutlineOptions = {
	ancestorIdsById: Map<number, Array<number>>
	nodeById: Map<number, TopicTreeNode>
	outlineRootNode: TopicTreeNode | null
	visibleSectionIds: Array<number>
}

export function useTopicDetailOutline({
	ancestorIdsById,
	nodeById,
	outlineRootNode,
	visibleSectionIds
}: UseTopicDetailOutlineOptions) {
	const [expandedIds, setExpandedIds] = useState<Array<number>>([])
	const previousRootTopicIdRef = useRef<number | null>(null)
	const suppressSelectionRef = useRef(false)
	const rootTopicId = outlineRootNode?.id ?? null

	const subtreeTopicIds = useMemo(() => {
		if (!outlineRootNode) return new Set<number>()

		const ids = new Set<number>()
		const visitNode = (node: TopicTreeNode) => {
			ids.add(node.id)
			for (const childNode of node.children) {
				visitNode(childNode)
			}
		}

		visitNode(outlineRootNode)
		return ids
	}, [outlineRootNode])
	const defaultExpandedIds = useMemo(() => {
		if (!outlineRootNode) return []

		const ids: Array<number> = []
		const visitNode = (node: TopicTreeNode) => {
			if (node.children.length > 0) {
				ids.push(node.id)
			}

			for (const childNode of node.children) {
				visitNode(childNode)
			}
		}

		for (const childNode of outlineRootNode.children) {
			visitNode(childNode)
		}

		return ids
	}, [outlineRootNode])
	const visibleBranchIds = useMemo(() => {
		const branchIdSet = new Set<number>()

		for (const visibleSectionId of visibleSectionIds) {
			const branchIds = ancestorIdsById.get(visibleSectionId) ?? []
			for (const topicId of [...branchIds, visibleSectionId]) {
				if (subtreeTopicIds.has(topicId)) {
					branchIdSet.add(topicId)
				}
			}
		}

		return [...branchIdSet]
	}, [ancestorIdsById, subtreeTopicIds, visibleSectionIds])
	const expandedIdSet = useMemo(() => new Set(expandedIds), [expandedIds])

	const ensureExpanded = (topicId: number) => {
		setExpandedIds(previousExpandedIds =>
			previousExpandedIds.includes(topicId)
				? previousExpandedIds
				: [...previousExpandedIds, topicId]
		)
	}

	const toggleExpanded = (topicId: number) => {
		setExpandedIds(previousExpandedIds =>
			previousExpandedIds.includes(topicId)
				? previousExpandedIds.filter(id => id !== topicId)
				: [...previousExpandedIds, topicId]
		)
	}
	const {
		handleConfirmDeleteTopic,
		handleCreateSubtopic,
		handleDialogOpenChange,
		isCreatingTopic,
		isDeletingTopic,
		pendingDeleteTopic,
		pendingDeleteTopicId,
		setPendingDeleteTopicId
	} = useTopicTreeActions({
		activeTopicId: outlineRootNode?.id,
		ancestorIdsById,
		nodeById,
		onAfterCreateSubtopic: parentTopicId => {
			ensureExpanded(parentTopicId)
		}
	})

	useEffect(() => {
		setExpandedIds(previousExpandedIds => {
			if (rootTopicId == null) {
				previousRootTopicIdRef.current = null
				return []
			}

			if (previousRootTopicIdRef.current !== rootTopicId) {
				previousRootTopicIdRef.current = rootTopicId
				return defaultExpandedIds
			}

			return previousExpandedIds.filter(topicId => subtreeTopicIds.has(topicId))
		})
	}, [defaultExpandedIds, rootTopicId, subtreeTopicIds])

	useEffect(() => {
		if (visibleBranchIds.length === 0) return

		setExpandedIds(previousExpandedIds => {
			const nextExpandedIds = [...previousExpandedIds]
			for (const topicId of visibleBranchIds) {
				if (!nextExpandedIds.includes(topicId)) {
					nextExpandedIds.push(topicId)
				}
			}
			return nextExpandedIds
		})
	}, [visibleBranchIds])

	return {
		expandedIdSet,
		handleConfirmDeleteTopic,
		handleCreateSubtopic,
		handleDialogOpenChange,
		isDeletingTopic,
		isUpdatingTopic: isCreatingTopic || isDeletingTopic,
		pendingDeleteTopic,
		pendingDeleteTopicId,
		setPendingDeleteTopicId,
		suppressSelectionRef,
		toggleExpanded
	}
}
