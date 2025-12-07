import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Loader2, Plus, Search, SquarePen, User2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createTopicReview as createTopicReviewApi } from '~/features/reviews/api/createTopicReview'
import type { Topic } from '~/models/review-topic.types'
import { useCreateRelationship } from '../api/createTopicRelationship'
import { useDeleteRelationship } from '../api/deleteTopicRelationship'
import { getTopicParents } from '../api/getTopicParents'
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

	const { data: parents = [] } = useQuery({
		queryKey: ['topics', topicId, 'parents'],
		queryFn: () => {
			if (!topicId) throw new Error('Topic ID is required')
			return getTopicParents(topicId)
		},
		enabled: topicId !== undefined
	})

	const deleteRelationship = useDeleteRelationship()
	const createRelationship = useCreateRelationship()
	const queryClient = useQueryClient()
	const { mutateAsync: createTopicReview } = useMutation({
		mutationFn: createTopicReviewApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['topics', 'reviews'] })
		}
	})

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

	const handleCreateNew = useCallback(
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

				// fire and forget 'Created' review creation
				createTopicReview({
					topic_id: newTopicId,
					review: {
						description: 'Created',
						notes: '',
						scheduled_at: null,
						completed_at: dayjs().format('YYYY-MM-DD')
					},
					rating: 'good'
				}).catch(() => {
					// Ignore fire-and-forget errors (for now)
				})

				// Navigate to the created topic
				handleParentSelect(newTopicId)
			} catch (_error) {
				// Error is handled by React Query mutation state
			}
		},
		[topicId, createRelationship, handleParentSelect, createTopicReview]
	)

	const handleTopicSelected = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			try {
				await createRelationship.mutateAsync({
					parent: topic.id,
					child: topicId
				})

				// Navigate to the selected topic
				handleParentSelect(topic.id)
			} catch (_error) {
				// Error is handled by React Query mutation state
			}
		},
		[topicId, createRelationship, handleParentSelect]
	)

	return (
		<>
			<div className='flex flex-wrap items-center gap-2'>
				<div className='flex items-center gap-2'>
					<User2 className='h-4 w-4' />
					<span className='font-medium text-muted-foreground text-xs'>
						Parents ({parents.length})
					</span>
				</div>
				{parents.map(parent => (
					<TopicBadge
						key={parent.id}
						name={parent.name}
						notes={parent.notes}
						onClick={() => handleParentSelect(parent.id)}
						onRemove={() => {
							if (!topicId) return
							deleteRelationship.mutate({
								parent: parent.id,
								child: topicId
							})
						}}
					/>
				))}
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
						<DropdownMenuItem onClick={() => handleCreateNew()}>
							<SquarePen className='h-4 w-4' />
							Create New
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<AddRelationshipDialog
				isCreating={isCreating}
				onCreateNew={handleCreateNew}
				onOpenChange={setShowCreateDialog}
				onSelected={handleTopicSelected}
				open={showCreateDialog}
				relationshipType='parent'
				topicId={topicId}
			/>
		</>
	)
}
