import { X } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/components/ui/tooltip'

interface SourceBadgeProps {
	title?: string | null
	notes?: string | null
	onRemove?: () => void
	onClick?: () => void
	onMouseEnter?: () => void
}

export function SourceBadge({
	title,
	notes,
	onRemove,
	onClick,
	onMouseEnter
}: SourceBadgeProps) {
	const displayText = title ?? notes ?? ''

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
					<TooltipContent className='max-w-72'>
						{title && (
							<h3 className='break-word font-semibold [overflow-wrap:anywhere]'>
								{title}
							</h3>
						)}
						{title && notes && <br />}
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
