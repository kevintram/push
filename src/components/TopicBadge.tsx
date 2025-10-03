import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/components/ui/Tooltip'

interface TopicBadgeProps {
	topicId: number
	name?: string | null
	notes?: string | null
	onRemove: () => void
}

export function TopicBadge({
	topicId,
	name,
	notes,
	onRemove
}: TopicBadgeProps) {
	const displayText = name ? name : notes

	return (
		<div className='group/badge relative'>
			<TooltipProvider>
				<Tooltip delayDuration={700}>
					<TooltipTrigger asChild={true}>
						<Badge
							className='flex min-w-16 cursor-pointer items-center gap-0.5 px-2 py-1 text-xs hover:bg-secondary/80'
							variant='secondary'
						>
							<Link
								className='max-w-32 flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap text-center font-semibold text-md'
								params={{ topicId: topicId.toString() }}
								to='/topics/{-$topicId}'
							>
								{displayText}
							</Link>
							<Button
								className='-top-2 absolute right-0 h-4 w-2 items-center justify-center rounded-full border-0 p-0 opacity-0 transition-opacity hover:opacity-100 group-hover/badge:opacity-100'
								onClick={onRemove}
								variant='default'
							>
								<X className='h-4 w-2' />
							</Button>
						</Badge>
					</TooltipTrigger>
					<TooltipContent className='max-w-72' side='bottom'>
						{name && (
							<h3 className='break-word font-semibold text-md [overflow-wrap:anywhere]'>
								{name}
							</h3>
						)}
						{name && notes && <br />}
						{notes && (
							<p className='break-word text-xs [overflow-wrap:anywhere]'>
								{notes}
							</p>
						)}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	)
}
