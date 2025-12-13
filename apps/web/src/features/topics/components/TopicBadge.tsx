import { X } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import type { Rating } from '~/features/reviews/types/review.types'
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
	rating
}: TopicBadgeProps) {
	const displayText = name ?? notes ?? ''

	return (
		<div className='group/badge relative'>
			<TooltipProvider>
				<Tooltip delayDuration={700}>
					<TooltipTrigger asChild={true}>
						<Badge
							className='flex h-6 min-w-16 max-w-32 cursor-pointer items-center justify-start gap-1 px-2 py-1 font-semibold text-xs hover:bg-secondary/80'
							onClick={onClick}
							variant='secondary'
						>
							{getRatingIcon(rating)}
							<span className='min-w-0 flex-1 truncate'>{displayText}</span>
						</Badge>
					</TooltipTrigger>
					<TooltipContent className='max-w-72' side='bottom'>
						{name && (
							<h3 className='break-word font-semibold [overflow-wrap:anywhere]'>
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
			{onRemove && (
				<Button
					className='-top-2 dark:!bg-input dark:hover:!bg-destructive/90 absolute right-0 h-4 w-4 items-center justify-center border-0 p-0 opacity-0 transition-opacity hover:opacity-100 group-hover/badge:opacity-100'
					onClick={onRemove}
					variant='outline'
				>
					<X className='h-4 w-4' />
				</Button>
			)}
		</div>
	)
}
