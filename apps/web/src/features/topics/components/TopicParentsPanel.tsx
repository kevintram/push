import { useQueryClient } from '@tanstack/react-query'
import {
	ChevronDown,
	Loader2,
	Plus,
	Search,
	SquarePen,
	User2
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
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
import { AddTopicDialog } from './AddTopicDialog'
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
	const [showAddTopicDialog, setShowAddTopicDialog] = useState(false)
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

	const handleAdd = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			await createRelationship.mutateAsync({
				parent: topic.id,
				child: topicId
			})
		},
		[topicId, createRelationship]
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
							className='cursor-pointer items-center gap-1 py-1 hover:bg-muted/50'
							variant='secondary'
						>
							{isCreating ? (
								<Loader2 className='h-3 w-3 animate-spin' />
							) : (
								<>
									<Plus className='h-3 w-3' />
									<ChevronDown className='h-3 w-3' />
								</>
							)}
						</Badge>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='start'>
						<DropdownMenuItem onClick={() => setShowAddTopicDialog(true)}>
							<SquarePen className='h-4 w-4' />
							Create New
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
							<Search className='h-4 w-4' />
							Search
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<AddRelationshipDialog
				isCreating={isCreating}
				onCreateNew={() => {
					setShowCreateDialog(false)
					setShowAddTopicDialog(true)
				}}
				onOpenChange={setShowCreateDialog}
				onSelected={handleAdd}
				open={showCreateDialog}
				relationshipType='parent'
				topicId={topicId}
			/>

			{topicId && (
				<AddTopicDialog
					context={{
						type: 'parent',
						childTopicId: topicId
					}}
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
				/>
			)}
		</>
	)
}
