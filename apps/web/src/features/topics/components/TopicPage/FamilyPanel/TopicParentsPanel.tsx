import { Plus, User2 } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import { useDeleteRelationship } from '~/features/topics/hooks/useDeleteRelationship'
import { useTopicParents } from '~/features/topics/hooks/useTopicParents'
import { useTopicDialog } from '../../../hooks/useTopicDialog'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { TopicBadge } from '../../TopicBadge'
import { AddRelationshipDialog } from '../AddRelationshipDialog'

export function TopicParentsPanel() {
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const { topic: selectedTopic } = use(TopicContext)
	const { openTopicDialog } = useTopicDialog()

	const { data: parents = [] } = useTopicParents(selectedTopic?.id)

	const deleteRelationship = useDeleteRelationship()

	const handleAddParent = useCallback(() => {
		setShowCreateDialog(true)
	}, [])

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
				open={showCreateDialog}
				relationshipType='parent'
				topicId={selectedTopic?.id}
			/>
		</>
	)
}
