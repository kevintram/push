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
	const rootTopicId = outlineRootNode?.id ?? null
	const suppressSelectionRef = useRef(false)

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
	const [expandedIds, setExpandedIds] = useState<Array<number>>(
		() => defaultExpandedIds
	)
	const [manuallyCollapsedIds, setManuallyCollapsedIds] = useState<
		Array<number>
	>([])
	const previousRootTopicIdRef = useRef<number | null>(rootTopicId)
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
	const manuallyCollapsedIdSet = useMemo(
		() => new Set(manuallyCollapsedIds),
		[manuallyCollapsedIds]
	)

	const ensureExpanded = (topicId: number) => {
		setManuallyCollapsedIds(previousCollapsedIds =>
			previousCollapsedIds.includes(topicId)
				? previousCollapsedIds.filter(id => id !== topicId)
				: previousCollapsedIds
		)
		setExpandedIds(previousExpandedIds =>
			previousExpandedIds.includes(topicId)
				? previousExpandedIds
				: [...previousExpandedIds, topicId]
		)
	}

	const toggleExpanded = (topicId: number) => {
		if (expandedIdSet.has(topicId)) {
			setManuallyCollapsedIds(previousCollapsedIds =>
				previousCollapsedIds.includes(topicId)
					? previousCollapsedIds
					: [...previousCollapsedIds, topicId]
			)
			setExpandedIds(previousExpandedIds =>
				previousExpandedIds.filter(id => id !== topicId)
			)
			return
		}

		setManuallyCollapsedIds(previousCollapsedIds =>
			previousCollapsedIds.includes(topicId)
				? previousCollapsedIds.filter(id => id !== topicId)
				: previousCollapsedIds
		)
		setExpandedIds(previousExpandedIds => [...previousExpandedIds, topicId])
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
		const didRootTopicChange = previousRootTopicIdRef.current !== rootTopicId
		previousRootTopicIdRef.current = rootTopicId

		setExpandedIds(previousExpandedIds => {
			if (rootTopicId == null) {
				return previousExpandedIds.length === 0 ? previousExpandedIds : []
			}

			if (didRootTopicChange) {
				return defaultExpandedIds
			}

			const nextExpandedIds = previousExpandedIds.filter(topicId =>
				subtreeTopicIds.has(topicId)
			)
			return nextExpandedIds.length === previousExpandedIds.length
				? previousExpandedIds
				: nextExpandedIds
		})

		setManuallyCollapsedIds(previousCollapsedIds => {
			if (rootTopicId == null) {
				return previousCollapsedIds.length === 0 ? previousCollapsedIds : []
			}

			if (didRootTopicChange) {
				return []
			}

			const nextCollapsedIds = previousCollapsedIds.filter(topicId =>
				subtreeTopicIds.has(topicId)
			)
			return nextCollapsedIds.length === previousCollapsedIds.length
				? previousCollapsedIds
				: nextCollapsedIds
		})
	}, [defaultExpandedIds, rootTopicId, subtreeTopicIds])

	useEffect(() => {
		if (visibleBranchIds.length === 0) return

		setExpandedIds(previousExpandedIds => {
			const nextExpandedIds = [...previousExpandedIds]
			for (const topicId of visibleBranchIds) {
				if (manuallyCollapsedIdSet.has(topicId)) {
					continue
				}
				if (!nextExpandedIds.includes(topicId)) {
					nextExpandedIds.push(topicId)
				}
			}
			return nextExpandedIds
		})
	}, [manuallyCollapsedIdSet, visibleBranchIds])

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
