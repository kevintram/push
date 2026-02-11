import { useQueryClient } from '@tanstack/react-query'
import { User2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import { useTopicDialog } from '~/features/dialogs/hooks/useTopicDialog'
import { useSetTopicParent } from '../api/createTopicRelationship'
import { useDeleteRelationship } from '../api/deleteTopicRelationship'
import { useTopicWithRelationships } from '../api/getTopic'
import type { Topic } from '../types/topic.types'
import { prefetchTopicRelations } from '../utils/prefetchTopicRelations'
import { AddTopicDialog } from './AddTopicDialog'
import { TopicBadge } from './TopicBadge'

interface TopicParentsPanelProps {
	topicId: number | undefined
	/**
	 * Parent topic from the single getTopic fetch.
	 * When provided, the panel uses this directly instead of making a separate API call.
	 */
	parent?: Topic | null
	parentId?: number | null
	/**
	 * Called when a parent is selected/clicked.
	 * If not provided, defaults to opening the topic dialog.
	 */
	onParentSelect?: (topicId: number) => void
}

export function TopicParentsPanel({
	topicId,
	parent: parentProp,
	parentId,
	onParentSelect
}: TopicParentsPanelProps) {
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showAddTopicDialog, setShowAddTopicDialog] = useState(false)
	const { openTopicDialog } = useTopicDialog()
	const queryClient = useQueryClient()

	const { topic: fetchedParent } = useTopicWithRelationships(
		parentId ?? undefined
	)
	const parent = parentProp !== undefined ? parentProp : fetchedParent
	const hasParent = parent != null

	const deleteRelationship = useDeleteRelationship()
	const setParent = useSetTopicParent()

	const isCreating = setParent.isPending

	// Determine navigation behavior
	const handleParentSelect = useCallback(
		(parentTopicId: number) => {
			if (onParentSelect) {
				onParentSelect(parentTopicId)
			} else {
				openTopicDialog(parentTopicId)
			}
		},
		[onParentSelect, openTopicDialog]
	)

	const handleAdd = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			await setParent.mutateAsync({
				parentId: topic.id,
				childId: topicId
			})
		},
		[topicId, setParent]
	)

	const handleParentMouseEnter = useCallback(
		(parent: Topic) => {
			prefetchTopicRelations(queryClient, parent)
		},
		[queryClient]
	)

	return (
		<>
			<div className='flex flex-wrap items-center gap-2'>
				<div className='flex items-center gap-2'>
					<User2 className='h-4 w-4' />
					<span className='font-medium text-muted-foreground text-xs'>
						Parent
					</span>
				</div>
				{parent ? (
					<TopicBadge
						name={parent.name}
						notes={parent.notes}
						onClick={() => handleParentSelect(parent.id)}
						onMouseEnter={() => handleParentMouseEnter(parent)}
						onRemove={() => {
							if (!topicId) return
							deleteRelationship.mutate({
								parent: parent.id,
								child: topicId
							})
						}}
					/>
				) : null}
				{topicId && !hasParent && (
					<AddEntityMenu
						buttonClassName='rounded-full'
						buttonSize='xs'
						createItems={[
							{
								label: 'Create Topic',
								onSelect: () => setShowAddTopicDialog(true)
							}
						]}
						isLoading={isCreating}
						onSearch={() => setShowSearchDialog(true)}
						searchLabel='Search Topics'
					/>
				)}
			</div>

			{topicId && (
				<EntitySearchDialog
					defaultType='topic'
					entityTypes={['topic']}
					existingIds={{
						topic: parent ? [parent.id] : []
					}}
					onOpenChange={setShowSearchDialog}
					onSelected={(_type, topic) => handleAdd(topic as Topic)}
					open={showSearchDialog}
					title='Search parent topics'
					topicSearchParams={{
						addableAsParentTo: topicId
					}}
				/>
			)}

			{topicId && (
				<AddTopicDialog
					onOpenChange={setShowAddTopicDialog}
					onSuccess={newTopicId => {
						toast('Topic created', {
							action: {
								label: 'Open',
								onClick: () => handleParentSelect(newTopicId)
							}
						})
					}}
					open={showAddTopicDialog}
					relationship={{
						kind: 'parent',
						childTopicId: topicId
					}}
				/>
			)}
		</>
	)
}
