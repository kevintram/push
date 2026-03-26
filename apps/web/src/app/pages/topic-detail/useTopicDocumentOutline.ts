import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { requestFocusNewTopicTitle } from '~/features/topics/createTopicIntent'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'

type UseTopicDocumentOutlineOptions = {
	activeSectionId: number
	ancestorIdsById: Map<number, Array<number>>
	nodeById: Map<number, TopicTreeNode>
	outlineRootNode: TopicTreeNode | null
}

export function useTopicDocumentOutline({
	activeSectionId,
	ancestorIdsById,
	nodeById,
	outlineRootNode
}: UseTopicDocumentOutlineOptions) {
	const navigate = useNavigate()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const [expandedIds, setExpandedIds] = useState<Array<number>>([])
	const [pendingDeleteTopicId, setPendingDeleteTopicId] = useState<
		number | null
	>(null)
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
	const activeBranchIds = useMemo(() => {
		const branchIds = ancestorIdsById.get(activeSectionId) ?? []
		return [...branchIds, activeSectionId].filter(topicId =>
			subtreeTopicIds.has(topicId)
		)
	}, [activeSectionId, ancestorIdsById, subtreeTopicIds])
	const pendingDeleteTopic =
		pendingDeleteTopicId == null ? null : nodeById.get(pendingDeleteTopicId)
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

	const handleCreateSubtopic = async (parentTopicId: number) => {
		if (isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: parentTopicId
			})
			requestFocusNewTopicTitle(created.id)
			ensureExpanded(parentTopicId)
			await navigate({
				to: '/topics/$topicId',
				params: { topicId: created.id.toString() }
			})
		} catch {
			toast.error('Failed to create subtopic')
		}
	}

	const handleDeleteTopic = async () => {
		if (pendingDeleteTopicId == null || isDeletingTopic) return

		const topicToDelete = nodeById.get(pendingDeleteTopicId)
		if (!topicToDelete) {
			setPendingDeleteTopicId(null)
			return
		}

		const activeTopicAncestorIds = ancestorIdsById.get(activeSectionId) ?? []
		const shouldNavigateAway =
			activeSectionId === topicToDelete.id ||
			activeTopicAncestorIds.includes(topicToDelete.id)

		try {
			await deleteTopicAsync(topicToDelete.id)
			setPendingDeleteTopicId(null)
			toast.success('Topic deleted')

			if (!shouldNavigateAway) return

			if (
				topicToDelete.parent_id != null &&
				nodeById.has(topicToDelete.parent_id)
			) {
				await navigate({
					to: '/topics/$topicId',
					params: { topicId: topicToDelete.parent_id.toString() }
				})
			} else {
				await navigate({ to: '/topics' })
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete topic'
			)
		}
	}

	useEffect(() => {
		setExpandedIds(defaultExpandedIds)
	}, [defaultExpandedIds])

	useEffect(() => {
		if (activeBranchIds.length === 0) return

		setExpandedIds(previousExpandedIds => {
			const nextExpandedIds = [...previousExpandedIds]
			for (const topicId of activeBranchIds) {
				if (!nextExpandedIds.includes(topicId)) {
					nextExpandedIds.push(topicId)
				}
			}
			return nextExpandedIds
		})
	}, [activeBranchIds])

	return {
		expandedIdSet,
		handleConfirmDeleteTopic: () => {
			handleDeleteTopic().catch(() => {})
		},
		handleCreateSubtopic: (topicId: number) => {
			handleCreateSubtopic(topicId).catch(() => {})
		},
		handleDialogOpenChange: (open: boolean) => {
			if (!open) setPendingDeleteTopicId(null)
		},
		isDeletingTopic,
		isUpdatingTopic: isCreatingTopic || isDeletingTopic,
		pendingDeleteTopic,
		pendingDeleteTopicId,
		setPendingDeleteTopicId,
		suppressSelectionRef,
		toggleExpanded
	}
}
