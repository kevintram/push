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
	onMouseEnter?: () => void
	maxWidth?: number
	rating?: Rating | null
}

export function TopicBadge({
	name,
	notes,
	onRemove,
	onClick,
	onMouseEnter,
	rating
}: TopicBadgeProps) {
	const displayText = name ?? notes ?? ''

	return (
		<div className='group/badge relative'>
			<TooltipProvider>
				<Tooltip delayDuration={700}>
					<TooltipTrigger
						render={
							<Badge
								className='flex h-6 min-w-16 max-w-32 cursor-pointer items-center justify-start gap-1 px-2 py-1 text-center font-semibold text-xs hover:bg-secondary/80'
								onClick={onClick}
								onMouseEnter={onMouseEnter}
								variant='outline'
							>
								{getRatingIcon(rating)}
								<span className='min-w-0 flex-1 truncate'>{displayText}</span>
								{onRemove && (
									<div className='-translate-y-1/2 mask-fade-in absolute top-1/2 right-0 flex h-6 items-center justify-center rounded-r-full bg-secondary pl-4 opacity-0 transition-opacity hover:opacity-100 group-hover/badge:opacity-100'>
										<Button
											className='h-4 w-4 text-muted-foreground hover:text-foreground'
											onClick={e => {
												e.stopPropagation()
												onRemove()
											}}
											variant='ghost'
										>
											<X className='h-4 w-4' />
										</Button>
									</div>
								)}
							</Badge>
						}
					/>
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
		</div>
	)
}
