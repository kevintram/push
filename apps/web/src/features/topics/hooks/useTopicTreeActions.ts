import { useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { requestFocusNewTopicTitle } from '~/features/topics/createTopicIntent'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'

type UseTopicTreeActionsOptions = {
	activeTopicId?: number | null
	ancestorIdsById: Map<number, Array<number>>
	nodeById: Map<number, TopicTreeNode>
	onAfterCreateSubtopic?: (
		parentTopicId: number,
		createdTopicId: number
	) => void | Promise<void>
	onAfterRouteChange?: () => void | Promise<void>
}

export function useTopicTreeActions({
	activeTopicId = null,
	ancestorIdsById,
	nodeById,
	onAfterCreateSubtopic,
	onAfterRouteChange
}: UseTopicTreeActionsOptions) {
	const navigate = useNavigate()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const [pendingDeleteTopicId, setPendingDeleteTopicId] = useState<
		number | null
	>(null)

	const pendingDeleteTopic = useMemo(
		() =>
			pendingDeleteTopicId == null ? null : nodeById.get(pendingDeleteTopicId),
		[nodeById, pendingDeleteTopicId]
	)

	const handleCreateSubtopic = useCallback(
		async (parentTopicId: number) => {
			if (isCreatingTopic) return

			try {
				const created = await createTopicAsync({
					title: '',
					body: '',
					parent_id: parentTopicId
				})
				requestFocusNewTopicTitle(created.id)
				await onAfterCreateSubtopic?.(parentTopicId, created.id)
				await navigate({
					to: '/topics/$topicId',
					params: { topicId: created.id.toString() }
				})
				await onAfterRouteChange?.()
			} catch {
				toast.error('Failed to create topic')
			}
		},
		[
			createTopicAsync,
			isCreatingTopic,
			navigate,
			onAfterCreateSubtopic,
			onAfterRouteChange
		]
	)

	const handleDeleteTopic = useCallback(async () => {
		if (pendingDeleteTopicId == null || isDeletingTopic) return

		const topicToDelete = nodeById.get(pendingDeleteTopicId)
		if (!topicToDelete) {
			setPendingDeleteTopicId(null)
			return
		}

		const activeTopicAncestorIds =
			activeTopicId == null ? [] : (ancestorIdsById.get(activeTopicId) ?? [])
		const shouldNavigateAway =
			activeTopicId === topicToDelete.id ||
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
			await onAfterRouteChange?.()
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete topic'
			)
		}
	}, [
		activeTopicId,
		ancestorIdsById,
		deleteTopicAsync,
		isDeletingTopic,
		navigate,
		nodeById,
		onAfterRouteChange,
		pendingDeleteTopicId
	])

	return {
		handleConfirmDeleteTopic: () => {
			handleDeleteTopic().catch(() => {})
		},
		handleCreateSubtopic: (topicId: number) => {
			handleCreateSubtopic(topicId).catch(() => {})
		},
		handleDialogOpenChange: (open: boolean) => {
			if (!open) setPendingDeleteTopicId(null)
		},
		isCreatingTopic,
		isDeletingTopic,
		pendingDeleteTopic,
		pendingDeleteTopicId,
		setPendingDeleteTopicId
	}
}
