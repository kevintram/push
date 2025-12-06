import { useQuery } from '@tanstack/react-query'
import { Loader2, Plus, Search, SquarePen, User2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { getTopicParents } from '~/features/topics/api/getTopicParents'
import { TopicBadge } from '~/features/topics/components/TopicBadge'
import { AddRelationshipDialog } from '~/features/topics/components/TopicPage/AddRelationshipDialog'
import { useCreateRelationship } from '~/features/topics/hooks/useCreateRelationship'
import { useCreateTopic } from '~/features/topics/hooks/useCreateTopic'
import { useDeleteRelationship } from '~/features/topics/hooks/useDeleteRelationship'
import { cn } from '~/lib/utils'
import type { Topic } from '~/models/review-topic.types'

interface ReviewTopicParentsPanelProps {
	topic?: Topic
	onParentSelect: (parent: Topic) => void
	onNestedTopicCreated: (topic: Topic) => Promise<void>
}

export function ReviewTopicParentsPanel({
	topic,
	onParentSelect,
	onNestedTopicCreated
}: ReviewTopicParentsPanelProps) {
	const [showSearchDialog, setShowSearchDialog] = useState(false)

	const { data: parents = [] } = useQuery({
		queryKey: ['topics', topic?.id, 'parents'],
		queryFn: () => getTopicParents(topic!.id),
		enabled: topic?.id !== undefined
	})

	const createTopic = useCreateTopic()
	const createRelationship = useCreateRelationship()
	const deleteRelationship = useDeleteRelationship()

	const isCreating = createTopic.isPending || createRelationship.isPending

	const handleCreateNew = useCallback(async () => {
		if (!topic) return

		try {
			// Create blank topic
			const newTopic = await createTopic.mutateAsync({
				name: '',
				notes: ''
			})

			// Create relationship (new topic is parent)
			await createRelationship.mutateAsync({
				parent: newTopic.id,
				child: topic.id
			})

			// Call the callback which will add to review and navigate
			await onNestedTopicCreated(newTopic)
		} catch (_error) {}
	}, [topic, createTopic, createRelationship, onNestedTopicCreated])

	const handleTopicCreatedFromSearch = useCallback(
		async (newTopic: Topic) => {
			if (!topic) return

			try {
				// Create relationship (new topic is parent)
				await createRelationship.mutateAsync({
					parent: newTopic.id,
					child: topic.id
				})
				await onNestedTopicCreated(newTopic)
			} catch (_error) {}
		},
		[topic, createRelationship, onNestedTopicCreated]
	)

	const handleExistingTopicSelected = useCallback(
		async (selectedTopic: Topic) => {
			if (!topic) return

			try {
				// Create relationship (selected topic is parent)
				await createRelationship.mutateAsync({
					parent: selectedTopic.id,
					child: topic.id
				})
				await onNestedTopicCreated(selectedTopic)
			} catch (_error) {}
		},
		[topic, createRelationship, onNestedTopicCreated]
	)

	const handleParentClick = (parent: Topic) => {
		onParentSelect(parent)
	}

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
						onClick={() => handleParentClick(parent)}
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
				onRelationshipCreated={handleTopicCreatedFromSearch}
				onTopicOpen={handleExistingTopicSelected}
				open={showSearchDialog}
				relationshipType='parent'
				topicId={topic?.id}
			/>
		</>
	)
}
