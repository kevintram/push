import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useTopicTreeActions } from '~/modules/topics/hooks/useTopicTreeActions'
import { type TopicTreeNode } from '~/modules/topics/utils/topicTree'

type UseTopicDetailOutlineOptions = {
	ancestorIdsById: Map<number, Array<number>>
	nodeById: Map<number, TopicTreeNode>
	onCreateSubtopicCreated?: (
		parentTopicId: number,
		createdTopicId: number,
	) => void | Promise<void>
	outlineRootNode: TopicTreeNode | null
	pendingCreatedParentTopicId?: number | null
	visibleSectionIds: Array<number>
}

export function useTopicDetailOutline({
	ancestorIdsById,
	nodeById,
	onCreateSubtopicCreated,
	outlineRootNode,
	pendingCreatedParentTopicId = null,
	visibleSectionIds,
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
	const collapsibleTopicIds = useMemo(
		() => defaultExpandedIds,
		[defaultExpandedIds],
	)
	const [expandedIds, setExpandedIds] = useState<Array<number>>(
		() => defaultExpandedIds,
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
		[manuallyCollapsedIds],
	)

	const ensureExpanded = useCallback((topicId: number) => {
		setManuallyCollapsedIds(previousCollapsedIds =>
			previousCollapsedIds.includes(topicId)
				? previousCollapsedIds.filter(id => id !== topicId)
				: previousCollapsedIds,
		)
		setExpandedIds(previousExpandedIds =>
			previousExpandedIds.includes(topicId)
				? previousExpandedIds
				: [...previousExpandedIds, topicId],
		)
	}, [])

	const toggleExpanded = useCallback((topicId: number) => {
		setExpandedIds(previousExpandedIds => {
			const isExpanded = previousExpandedIds.includes(topicId)

			setManuallyCollapsedIds(previousCollapsedIds => {
				if (isExpanded) {
					return previousCollapsedIds.includes(topicId)
						? previousCollapsedIds
						: [...previousCollapsedIds, topicId]
				}

				return previousCollapsedIds.includes(topicId)
					? previousCollapsedIds.filter(id => id !== topicId)
					: previousCollapsedIds
			})

			if (isExpanded) {
				return previousExpandedIds.filter(id => id !== topicId)
			}

			return [...previousExpandedIds, topicId]
		})
	}, [])
	const collapseAll = useCallback(() => {
		setExpandedIds([])
		setManuallyCollapsedIds(collapsibleTopicIds)
	}, [collapsibleTopicIds])
	const {
		handleConfirmDeleteTopic,
		handleCreateSubtopic,
		handleDialogOpenChange,
		isCreatingTopic,
		isDeletingTopic,
		pendingDeleteTopic,
		pendingDeleteTopicId,
		setPendingDeleteTopicId,
	} = useTopicTreeActions({
		activeTopicId: outlineRootNode?.id,
		ancestorIdsById,
		navigateToCreatedTopic: false,
		nodeById,
		onAfterCreateSubtopic: async (parentTopicId, createdTopicId) => {
			ensureExpanded(parentTopicId)
			await onCreateSubtopicCreated?.(parentTopicId, createdTopicId)
		},
	})

	useEffect(() => {
		if (pendingCreatedParentTopicId == null) return
		ensureExpanded(pendingCreatedParentTopicId)
	}, [ensureExpanded, pendingCreatedParentTopicId])

	useEffect(() => {
		const didRootTopicChange =
			previousRootTopicIdRef.current !== rootTopicId
		previousRootTopicIdRef.current = rootTopicId

		setExpandedIds(previousExpandedIds => {
			if (rootTopicId == null) {
				return previousExpandedIds.length === 0
					? previousExpandedIds
					: []
			}

			if (didRootTopicChange) {
				return defaultExpandedIds
			}

			const nextExpandedIds = previousExpandedIds.filter(topicId =>
				subtreeTopicIds.has(topicId),
			)
			return nextExpandedIds.length === previousExpandedIds.length
				? previousExpandedIds
				: nextExpandedIds
		})

		setManuallyCollapsedIds(previousCollapsedIds => {
			if (rootTopicId == null) {
				return previousCollapsedIds.length === 0
					? previousCollapsedIds
					: []
			}

			if (didRootTopicChange) {
				return []
			}

			const nextCollapsedIds = previousCollapsedIds.filter(topicId =>
				subtreeTopicIds.has(topicId),
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
			let didExpand = false
			for (const topicId of visibleBranchIds) {
				if (manuallyCollapsedIdSet.has(topicId)) {
					continue
				}
				if (!nextExpandedIds.includes(topicId)) {
					nextExpandedIds.push(topicId)
					didExpand = true
				}
			}
			return didExpand ? nextExpandedIds : previousExpandedIds
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
		collapseAll,
		suppressSelectionRef,
		toggleExpanded,
	}
}
