import { useQuery } from '@tanstack/react-query'
import { Loader2, Plus, Search, SquarePen, User2 } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { getTopicParents } from '~/features/topics/api/getTopicParents'
import { AddRelationshipDialog } from '~/features/topics/components/AddRelationshipDialog'
import { TopicBadge } from '~/features/topics/components/TopicBadge'
import { useCreateRelationship } from '~/features/topics/hooks/useCreateRelationship'
import { useCreateTopic } from '~/features/topics/hooks/useCreateTopic'
import { useDeleteRelationship } from '~/features/topics/hooks/useDeleteRelationship'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import { cn } from '~/lib/utils'

interface ReviewTopicParentsPanelProps {
	onParentSelect: (topicId: number) => void
}

export function ReviewTopicParentsPanel({
	onParentSelect
}: ReviewTopicParentsPanelProps) {
	const [showSearchDialog, setShowSearchDialog] = useState(false)

	const { topic } = use(TopicContext)

	const { data: parents = [] } = useQuery({
		queryKey: ['topics', topic?.id, 'parents'],
		queryFn: () => {
			if (!topic?.id) throw new Error('Topic ID is required')
			return getTopicParents(topic.id)
		},
		enabled: topic?.id !== undefined
	})

	const deleteRelationship = useDeleteRelationship()
	const createRelationship = useCreateRelationship()
	const createTopic = useCreateTopic()

	const isCreating = createTopic.isPending || createRelationship.isPending

	const handleCreateNew = useCallback(async () => {
		if (!topic) return

		try {
			const newTopic = await createTopic.mutateAsync({
				name: '',
				notes: '',
				archived: false,
				inboxed: false
			})

			await createRelationship.mutateAsync({
				parent: newTopic.id,
				child: topic.id
			})

			onParentSelect(newTopic.id)
		} catch (_error) {
			// Error is handled by React Query mutation state
		}
	}, [topic, createTopic, createRelationship, onParentSelect])

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
						onClick={() => onParentSelect(parent.id)}
						onRemove={() => {
							if (!topic) return
							deleteRelationship.mutate({
								parent: parent.id,
								child: topic.id
							})
						}}
					/>
				))}
				<DropdownMenu>
					<DropdownMenuTrigger asChild={true} disabled={isCreating}>
						<Badge
							className={cn(
								'cursor-pointer items-center border-dashed py-1 hover:bg-muted/50'
							)}
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
						<DropdownMenuItem onClick={() => setShowSearchDialog(true)}>
							<Search className='h-4 w-4' />
							Search
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleCreateNew}>
							<SquarePen className='h-4 w-4' />
							Create New
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<AddRelationshipDialog
				onOpenChange={setShowSearchDialog}
				onTopicCreated={onParentSelect}
				open={showSearchDialog}
				relationshipType='parent'
				topicId={topic?.id}
			/>
		</>
	)
}
