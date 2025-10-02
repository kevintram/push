import { GitPullRequestClosed, Plus, User2 } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { TopicBadge } from '~/components/TopicBadge'
import { Badge } from '~/components/ui/Badge'
import { DropdownMenuItem } from '~/components/ui/DropdownMenu'
import { useCreateRelationship } from '~/features/topic-hub/hooks/useCreateRelationship'
import { useDeleteRelationship } from '~/features/topic-hub/hooks/useDeleteRelationship'
import type { Tables } from '~/types/database.types'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'
import { AddRelationshipDialog } from '../AddRelationshipDialog'

export function TopicParentsPanel() {
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const { selectedTopic } = use(TopicHubContext)

	const createRelationship = useCreateRelationship()
	const deleteRelationship = useDeleteRelationship()

	const handleAddParent = useCallback(() => {
		setShowCreateDialog(true)
	}, [])

	const handleTopicCreated = useCallback(
		async (topic: Tables<'topics'>) => {
			if (!selectedTopic) return

			try {
				await createRelationship.mutateAsync({
					parent: topic.id,
					child: selectedTopic.id
				})
			} catch (_error) {
				// Error is handled by the mutation's error state
			}
		},
		[selectedTopic, createRelationship]
	)

	return (
		<>
			<div className='flex w-full flex-wrap items-center gap-2'>
				<div className='flex items-center gap-2'>
					<User2 className='h-4 w-4' />
					<span className='font-medium text-muted-foreground text-xs'>
						Parents
					</span>
				</div>
				{selectedTopic?.parents?.map(parent => (
					<TopicBadge
						key={parent.id}
						menuItems={
							<DropdownMenuItem
								className='text-red-600 focus:text-red-600'
								onClick={() => {
									if (!selectedTopic) return
									deleteRelationship.mutate({
										parent: parent.id,
										child: selectedTopic.id
									})
								}}
								variant='destructive'
							>
								<GitPullRequestClosed className='mr-2 h-4 w-4' />
								Remove as Parent
							</DropdownMenuItem>
						}
						name={parent.name}
						notes={parent.notes}
						topicId={parent.id}
					/>
				))}
				<Badge
					className='cursor-pointer items-center border-dashed py-1 hover:bg-muted/50'
					onClick={handleAddParent}
					variant='outline'
				>
					<Plus className='h-3 w-3' />
				</Badge>
			</div>

			<AddRelationshipDialog
				onOpenChange={setShowCreateDialog}
				onRelationshipCreated={handleTopicCreated}
				open={showCreateDialog}
				relationshipType='parent'
				topicId={selectedTopic?.id}
			/>
		</>
	)
}
