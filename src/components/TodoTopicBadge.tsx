import { Link } from '@tanstack/react-router'
import { MoreHorizontal, X } from 'lucide-react'
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
import type { Tables } from '~/types/database.types'

interface TodoTopicBadgeProps {
	topic: Tables<'topics'>
	todoId: number
	onRemove: (todoId: number, topicId: number) => Promise<void>
}

export function TodoTopicBadge({
	topic,
	todoId,
	onRemove
}: TodoTopicBadgeProps) {
	const handleRemove = () => {
		onRemove(todoId, topic.id)
	}

	const displayText = topic.name ? topic.name : topic.notes

	return (
		<div className='group relative'>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<Badge
							className='flex cursor-pointer items-center px-2 py-1 text-xs hover:bg-secondary/80'
							variant='secondary'
						>
							<Link
								className='max-w-24 flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap font-semibold text-md'
								params={{ topicId: topic.id.toString() }}
								to='/topics/{-$topicId}'
							>
								{displayText}
							</Link>
						</Badge>
					</TooltipTrigger>
					<TooltipContent className='max-w-72'>
						{topic.name && (
							<h3 className='break-word font-semibold text-md [overflow-wrap:anywhere]'>
								{topic.name}
							</h3>
						)}
						{topic.name && topic.notes && <br />}
						{topic.notes && (
							<p className='break-word text-xs [overflow-wrap:anywhere]'>
								{topic.notes}
							</p>
						)}
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
						onClick={handleRemove}
					>
						<X className='mr-2 h-3 w-3' />
						Remove
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
