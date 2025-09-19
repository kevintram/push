import { User2 } from 'lucide-react'
import { use } from 'react'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'
import { AddRelationshipBadge } from './AddRelationshipBadge'
import { RelationshipBadge } from './RelationshipBadge'

export function TopicParentsPanel() {
	const { selectedTopic } = use(TopicHubContext)

	return (
		<div className='flex w-full flex-wrap items-center gap-2'>
			<div className='flex items-center gap-2'>
				<User2 className='h-4 w-4' />
				<span className='font-medium text-muted-foreground text-xs'>
					Parents
				</span>
			</div>
			{selectedTopic?.parents?.map(parent => (
				<RelationshipBadge key={parent.id} kin={parent} relationship='parent' />
			))}
			<AddRelationshipBadge type='parent' />
		</div>
	)
}
