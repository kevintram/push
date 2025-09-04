import { Link } from '@tanstack/react-router'
import { Baby, User2 } from 'lucide-react'
import { use } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Card } from '~/components/ui/Card'
import { Separator } from '~/components/ui/Separator'
import type { Topic } from '~/types/topics.types'
import { TopicHubContext } from '../../stores/SelectedTopicContext'
import { AddRelationshipBadge } from './AddRelationshipBadge'

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
						<Badge
							className='cursor-pointer px-2 py-0.5 text-xs hover:bg-secondary/80'
							key={parent.id}
							variant='secondary'
						>
							<Link
								params={{ topicId: parent.id.toString() }}
								to='/topics/{-$topicId}'
							>
								{parent.name}
							</Link>
						</Badge>
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
						<Badge
							className='cursor-pointer px-2 py-0.5 text-xs hover:bg-secondary/80'
							key={child.id}
							variant='secondary'
						>
							<Link
								params={{ topicId: child.id.toString() }}
								to='/topics/{-$topicId}'
							>
								{child.name}
							</Link>
						</Badge>
					))}

					<AddRelationshipBadge type='child' />
				</div>
			</div>
		</Card>
	)
}
