import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Loader2, Plus, Search, SquarePen, User2 } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createTopicReview as createTopicReviewApi } from '~/features/topic_reviews/api'
import { getTopicParents } from '~/features/topics/api/getTopicParents'
import { AddRelationshipDialog } from '~/features/topics/components/AddRelationshipDialog'
import { useCreateRelationship } from '~/features/topics/hooks/useCreateRelationship'
import { useDeleteRelationship } from '~/features/topics/hooks/useDeleteRelationship'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { TopicBadge } from '../../TopicBadge'

export function TopicParentsPanel() {
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const { topic: selectedTopic } = use(TopicContext)
	const { openTopicDialog } = useReviewTopicDialog()

	const { data: parents = [] } = useQuery({
		queryKey: ['topics', selectedTopic?.id, 'parents'],
		queryFn: () => getTopicParents(selectedTopic!.id),
		enabled: selectedTopic?.id !== undefined
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

	const handleCreateNew = useCallback(
		async (query = '') => {
			if (!selectedTopic) return

			try {
				const newTopicData = {
					name: '',
					notes: query.trim() || '',
					archived: false,
					inboxed: false
				}

				// Use inline creation - create topic and relationship in one call
				const response = await createRelationship.mutateAsync({
					child: selectedTopic.id,
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

				// Open the created topic
				openTopicDialog(newTopicId)
			} catch (_error) {}
		},
		[selectedTopic, createRelationship, openTopicDialog, createTopicReview]
	)

	const handleTopicSelected = useCallback(
		async (topic: import('~/models/review-topic.types').Topic) => {
			if (!selectedTopic) return

			try {
				await createRelationship.mutateAsync({
					parent: topic.id,
					child: selectedTopic.id
				})

				// Open the selected topic dialog
				openTopicDialog(topic.id)
			} catch (_error) {
				// Error is handled by React Query mutation state
			}
		},
		[selectedTopic, createRelationship, openTopicDialog]
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
						onClick={() => openTopicDialog(parent.id)}
						onRemove={() => {
							if (!selectedTopic) return
							deleteRelationship.mutate({
								parent: parent.id,
								child: selectedTopic.id
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
				topicId={selectedTopic?.id}
			/>
		</>
	)
}
