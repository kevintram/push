import { Link } from '@tanstack/react-router'
import { GitPullRequestClosed, MoreHorizontal } from 'lucide-react'
import { use } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useDeleteRelationship } from '~/features/topic-hub/hooks/useDeleteRelationship'
import { TopicHubContext } from '~/features/topic-hub/stores/SelectedTopicContext'
import type { Topic } from '~/types/topics.types'

interface RelationshipBadgeProps {
	kin: Topic
	relationship: 'parent' | 'child'
}

export function RelationshipBadge({
	kin,
	relationship
}: RelationshipBadgeProps) {
	const { selectedTopic } = use(TopicHubContext)
	const deleteRelationship = useDeleteRelationship()

	const handleDelete = () => {
		if (!selectedTopic) return

		if (relationship === 'parent') {
			deleteRelationship.mutate({ parent: kin.id, child: selectedTopic.id })
		} else {
			deleteRelationship.mutate({ parent: selectedTopic.id, child: kin.id })
		}
	}

	return (
		<div className='group relative'>
			<Badge
				className='flex cursor-pointer items-center px-2 py-1 text-xs hover:bg-secondary/80'
				variant='secondary'
			>
				<Link
					className='flex-1'
					params={{ topicId: kin.id.toString() }}
					to='/topics/{-$topicId}'
				>
					{kin.name}
				</Link>
			</Badge>
			<DropdownMenu>
				<DropdownMenuTrigger asChild={true}>
					<Button
						className='-top-2 absolute right-1 h-4 w-4 p-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100'
						variant='secondary'
					>
						<MoreHorizontal className='h-3 w-3' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' side='bottom' sideOffset={2}>
					<DropdownMenuItem
						className='text-red-600 focus:text-red-600'
						onClick={handleDelete}
						variant='destructive'
					>
						<GitPullRequestClosed className='mr-2 h-4 w-4' />
						Remove
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
