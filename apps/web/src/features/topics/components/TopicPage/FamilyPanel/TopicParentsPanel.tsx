import { useQuery } from '@tanstack/react-query'
import { User2 } from 'lucide-react'
import { use, useState } from 'react'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { getTopicParents } from '~/features/topics/api/getTopicParents'
import { useDeleteRelationship } from '~/features/topics/hooks/useDeleteRelationship'
import type { Topic } from '~/models/review-topic.types'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { TopicBadge } from '../../TopicBadge'
import { AddRelationshipDialog } from '../AddRelationshipDialog'
import { AddRelationshipDropdown } from './AddRelationshipDropdown'

interface TopicParentsPanelProps {
	onParentSelect?: (parent: Topic) => void
	onTopicCreated?: (topic: Topic) => void
}

export function TopicParentsPanel({
	onParentSelect,
	onTopicCreated
}: TopicParentsPanelProps) {
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const { topic: selectedTopic } = use(TopicContext)
	const { openTopicDialog } = useReviewTopicDialog()

	const { data: parents = [] } = useQuery({
		queryKey: ['topics', selectedTopic?.id, 'parents'],
		queryFn: () => getTopicParents(selectedTopic!.id),
		enabled: selectedTopic?.id !== undefined
	})

	const deleteRelationship = useDeleteRelationship()

	const handleParentClick = (parent: Topic) => {
		if (onParentSelect) {
			onParentSelect(parent)
			return
		}
		openTopicDialog(parent.id)
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
							if (!selectedTopic) return
							deleteRelationship.mutate({
								parent: parent.id,
								child: selectedTopic.id
							})
						}}
					/>
				))}
				<AddRelationshipDropdown
					onOpenSearchDialog={() => setShowCreateDialog(true)}
					onRelationshipCreated={onTopicCreated}
					onTopicOpen={handleParentClick}
					relationshipType='parent'
					topicId={selectedTopic?.id}
					variant='badge'
				/>
			</div>

			<AddRelationshipDialog
				onOpenChange={setShowCreateDialog}
				onRelationshipCreated={onTopicCreated}
				onTopicOpen={handleParentClick}
				open={showCreateDialog}
				relationshipType='parent'
				topicId={selectedTopic?.id}
			/>
		</>
	)
}
