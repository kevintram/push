import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Search, SquarePen, User2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Skeleton } from '~/components/ui/Skeleton'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateRelationship } from '../api/createTopicRelationship'
import { useDeleteRelationship } from '../api/deleteTopicRelationship'
import { useTopicParents } from '../api/getTopicParents'
import { topicKeys } from '../api/queryKeys'
import type { Topic } from '../types/topic.types'
import { AddRelationshipDialog } from './AddRelationshipDialog'
import { TopicBadge } from './TopicBadge'

interface TopicParentsPanelProps {
	topicId: number | undefined
	/**
	 * Called when a parent is selected/clicked.
	 * If not provided, defaults to opening the topic dialog.
	 */
	onParentSelect?: (topicId: number) => void
}

export function TopicParentsPanel({
	topicId,
	onParentSelect
}: TopicParentsPanelProps) {
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const { openTopicDialog } = useReviewTopicDialog()
	const queryClient = useQueryClient()

	const { data: parents = [], isLoading } = useTopicParents(topicId)

	const deleteRelationship = useDeleteRelationship()
	const createRelationship = useCreateRelationship()

	const isCreating = createRelationship.isPending

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

	const handleCreateNewAndAdd = useCallback(
		async (query = '') => {
			if (!topicId) return

			try {
				const newTopicData = {
					name: '',
					notes: query.trim() || '',
					archived: false,
					inboxed: false
				}

				// Use inline creation - create topic and relationship in one call
				const response = await createRelationship.mutateAsync({
					child: topicId,
					parentData: newTopicData
				})

				// Get the newly created parent topic ID
				const newTopicId = response.parent.id

				// Navigate to the created topic
				handleParentSelect(newTopicId)
			} catch (_error) {
				// Error is handled by React Query mutation state
			}
		},
		[topicId, createRelationship, handleParentSelect]
	)

	const handleAdd = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			await createRelationship.mutateAsync({
				parent: topic.id,
				child: topicId
			})

			// Navigate to the selected topic
			handleParentSelect(topic.id)
		},
		[topicId, createRelationship, handleParentSelect]
	)

	const handleParentMouseEnter = useCallback(
		(parent: Topic) => {
			// Store parent topic in query cache for prefetching
			queryClient.setQueryData(topicKeys.detail(parent.id), parent)
			if (parent.parents && parent.parents.length > 0) {
				queryClient.setQueryData(topicKeys.parents(parent.id), parent.parents)
			}
			if (parent.children && parent.children.length > 0) {
				queryClient.setQueryData(topicKeys.children(parent.id), parent.children)
			}
			if (parent.related && parent.related.length > 0) {
				queryClient.setQueryData(topicKeys.related(parent.id), parent.related)
			}
		},
		[queryClient]
	)

	return (
		<>
			<div className='flex flex-wrap items-center gap-2'>
				<div className='flex items-center gap-2'>
					<User2 className='h-4 w-4' />
					<span className='font-medium text-muted-foreground text-xs'>
						Parent topics ({parents.length})
					</span>
				</div>
				{isLoading ? (
					<>
						<Skeleton className='h-6 w-20 rounded-full' />
						<Skeleton className='h-6 w-24 rounded-full' />
						<Skeleton className='h-6 w-16 rounded-full' />
					</>
				) : (
					parents.map(parent => (
						<TopicBadge
							key={parent.id}
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
					))
				)}
				<DropdownMenu>
					<DropdownMenuTrigger asChild={true} disabled={isCreating}>
						<Badge
							className='cursor-pointer items-center border-dashed py-1 hover:bg-muted/50'
							variant='outline'
						>
							{isCreating ? (
								<Loader2 className='h-3 w-3 animate-spin' />
							) : (
								<Plus className='h-3 w-3' />
							)}
						</Badge>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='start' side='right'>
						<DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
							<Search className='h-4 w-4' />
							Search
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleCreateNewAndAdd()}>
							<SquarePen className='h-4 w-4' />
							Create New
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<AddRelationshipDialog
				isCreating={isCreating}
				onCreateNew={handleCreateNewAndAdd}
				onOpenChange={setShowCreateDialog}
				onSelected={handleAdd}
				open={showCreateDialog}
				relationshipType='parent'
				topicId={topicId}
			/>
		</>
	)
}
