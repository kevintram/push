import type { ComponentProps } from 'react'
import { Fragment, isValidElement } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
	getOptionIcon,
	type ReviewRatingState,
	ratingOptions
} from './reviewRatingOptions'

interface RatingDropdownProps {
	onInteraction?: () => void
	onSelect: (value: ReviewRatingState) => void
	onOpenChange?: ComponentProps<typeof DropdownMenu>['onOpenChange']
	trigger: React.ReactNode
	align?: 'start' | 'center' | 'end'
	nativeButton?: boolean
}

export function RatingDropdown({
	onInteraction,
	onSelect,
	onOpenChange,
	trigger,
	align = 'start',
	nativeButton = true
}: RatingDropdownProps) {
	const triggerElement = isValidElement(trigger) ? (
		trigger
	) : (
		<span>{trigger}</span>
	)

	return (
		<DropdownMenu onOpenChange={onOpenChange}>
			<DropdownMenuTrigger
				nativeButton={nativeButton}
				render={triggerElement}
			/>
			<DropdownMenuContent align={align} onMouseDownCapture={onInteraction}>
				{ratingOptions.map(option => (
					<Fragment key={option.value}>
						<DropdownMenuItem
							onClick={e => {
								e.stopPropagation()
								onInteraction?.()
								onSelect(option.value)
							}}
							onSelect={e => e.stopPropagation()}
						>
							{option.value === 'uncompleted' ? (
								<div className='grid grid-cols-[auto_1fr] items-center gap-x-2'>
									{getOptionIcon(option.value)}
									<span>{option.label}</span>
									<span className='col-start-2 text-muted-foreground/70 text-xs'>
										For later
									</span>
								</div>
							) : (
								<div className='flex w-full items-center'>
									{getOptionIcon(option.value)}
									<span className='ml-2 flex flex-1'>{option.label}</span>
								</div>
							)}
						</DropdownMenuItem>
						{option.value === 'uncompleted' && <DropdownMenuSeparator />}
					</Fragment>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
