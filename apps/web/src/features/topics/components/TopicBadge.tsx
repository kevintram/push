import { X } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import type { Rating } from '~/models/todo-topic.types'
import { getRatingIcon } from '~/utils/getRatingIcon'

interface TopicBadgeProps {
	name?: string | null
	notes?: string | null
	onRemove?: () => void
	onClick?: () => void
	maxWidth?: number
	rating?: Rating | null
}

export function TopicBadge({
	name,
	notes,
	onRemove,
	onClick,
	maxWidth = 32,
	rating
}: TopicBadgeProps) {
	const displayText = name ? name : notes

	return (
		<div className='group/badge relative'>
			<TooltipProvider>
				<Tooltip delayDuration={700}>
					<TooltipTrigger asChild={true}>
						<Badge
							className='flex min-w-16 cursor-pointer items-center gap-1 px-2 py-1 text-xs hover:bg-secondary/80'
							variant='secondary'
						>
							{getRatingIcon(rating)}
							<button
								className='flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap border-0 bg-transparent p-0 text-center font-semibold text-md'
								onClick={onClick}
								style={{ maxWidth: `${maxWidth * 4}px` }}
								type='button'
							>
								{displayText}
							</button>
							{onRemove && (
								<Button
									className='-top-2 dark:!bg-input dark:hover:!bg-destructive/90 absolute right-0 h-4 w-4 items-center justify-center border-0 p-0 opacity-0 transition-opacity hover:opacity-100 group-hover/badge:opacity-100'
									onClick={onRemove}
									variant='outline'
								>
									<X className='h-4 w-4' />
								</Button>
							)}
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
