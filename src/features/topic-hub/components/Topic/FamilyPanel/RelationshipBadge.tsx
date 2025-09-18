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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/components/ui/Tooltip'
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

	const displayText = kin.name ? kin.name : kin.notes

	return (
		<div className='group relative'>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Badge
							className='flex cursor-pointer items-center px-2 py-1 text-xs hover:bg-secondary/80'
							variant='secondary'
						>
							<Link
								className='max-w-24 flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap font-semibold text-md'
								params={{ topicId: kin.id.toString() }}
								to='/topics/{-$topicId}'
							>
								{displayText}
							</Link>
						</Badge>
					</TooltipTrigger>
					<TooltipContent className="max-w-72">
						{kin.name && <h3 className="break-words font-semibold text-md">{kin.name}</h3>}
						{kin.name &&  kin.notes && <br/>}
						{kin.notes && <p className="break-words text-xs">{kin.notes}</p>}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<DropdownMenu>
				<DropdownMenuTrigger asChild={true}>
					<Button
						className='-top-2 absolute right-1 h-4 w-4 p-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100'
						variant='secondary'
					>
						<MoreHorizontal className='h-3 w-3' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='center' side='bottom' sideOffset={2}>
					<DropdownMenuItem
						className='text-red-600 focus:text-red-600'
						onClick={handleDelete}
						variant='destructive'
					>
						<GitPullRequestClosed className='mr-2 h-4 w-4' />
						Remove as Parent
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
