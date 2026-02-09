import { Dumbbell } from 'lucide-react'
import type { ReactNode } from 'react'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'

interface PracticeDetailHeaderProps {
	/**
	 * Content to render in the left section before the type indicator (e.g., navigation buttons)
	 */
	headerBeforeActions?: ReactNode
	/**
	 * Content to render on the right side (e.g., close/minimize buttons)
	 */
	afterActions?: ReactNode
}

export function PracticeDetailHeader({
	headerBeforeActions,
	afterActions
}: PracticeDetailHeaderProps) {
	return (
		<div className='sticky top-0 z-10 w-full border-b'>
			<div className='flex items-center justify-between gap-4 px-2 py-1'>
				<div className='flex min-w-0 flex-1 items-center gap-4'>
					{headerBeforeActions}
					<div className='flex items-center gap-2'>
						{/* Type indicator */}
						<Tooltip>
							<TooltipTrigger
								render={
									<div className='flex items-center gap-1 text-muted-foreground text-xs'>
										<Dumbbell className='h-3 w-3' />
										<span>Practice</span>
									</div>
								}
							/>
							<TooltipContent side='bottom'>This is a Practice</TooltipContent>
						</Tooltip>
					</div>
				</div>

				{afterActions && (
					<div className='flex items-center gap-2'>{afterActions}</div>
				)}
			</div>
		</div>
	)
}
