import { Baby, User2 } from 'lucide-react'
import { use } from 'react'
import { Card } from '~/components/ui/Card'
import { Separator } from '~/components/ui/Separator'
import type { Topic } from '~/types/topics.types'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'
import { AddRelationshipBadge } from './AddRelationshipBadge'
import { RelationshipBadge } from './RelationshipBadge'

export function TopicFamilyPanel() {
	const { selectedTopic } = use(TopicHubContext)

	return (
		<Card className='w-full px-3 shadow-sm'>
			<div className='space-y-4'>
				{/* Parents */}
				<div className='flex flex-wrap items-center gap-2'>
					<div className='flex items-center gap-2'>
						<User2 className='h-4 w-4' />
						<span className='font-medium text-muted-foreground text-xs'>
							Parents
						</span>
					</div>
					{selectedTopic?.parents?.map(parent => (
						<RelationshipBadge
							key={parent.id}
							kin={parent}
							relationship='parent'
						/>
					))}
					<AddRelationshipBadge type='parent' />
				</div>

				<Separator />

				{/* Children */}
				<div className='flex flex-wrap items-center gap-2'>
					<div className='flex items-center gap-2'>
						<Baby className='h-4 w-4' />
						<span className='font-medium text-muted-foreground text-xs'>
							Children
						</span>
					</div>
					{selectedTopic?.children.map((child: Topic) => (
						<RelationshipBadge
							key={child.id}
							kin={child}
							relationship='child'
						/>
					))}

					<AddRelationshipBadge type='child' />
				</div>
			</div>
		</Card>
	)
}
