import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '~/lib/utils'
import { RatingDropdown } from './RatingDropdown'
import { getOptionIcon, type ReviewRatingState } from './reviewRatingOptions'

export type { ReviewRatingState } from './reviewRatingOptions'

interface ReviewRatingDropdownProps {
	value: ReviewRatingState
	onChange: (value: ReviewRatingState) => void
	disabled?: boolean
	className?: string
	invalid?: boolean
	onMenuInteraction?: () => void
	onMenuOpenChange?: ComponentProps<typeof RatingDropdown>['onOpenChange']
	onTriggerInteract?: () => void
	/** Surface context the checkbox is rendered on; controls uncompleted indicator contrast. */
	surface?: 'default' | 'primary'
}

export function ReviewRatingCheckbox({
	value,
	onChange,
	disabled = false,
	className,
	invalid = false,
	onMenuInteraction,
	onMenuOpenChange,
	onTriggerInteract,
	surface = 'default'
}: ReviewRatingDropdownProps) {
	return (
		<RatingDropdown
			onInteraction={onMenuInteraction}
			onOpenChange={onMenuOpenChange}
			onSelect={onChange}
			trigger={
				<button
					aria-label='Set review status'
					className={cn(
						'flex cursor-pointer items-center gap-0.5 rounded-md border p-1 outline-none transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
						className
					)}
					disabled={disabled}
					onClick={event => {
						event.stopPropagation()
						onTriggerInteract?.()
					}}
					onMouseDown={event => {
						event.stopPropagation()
						onTriggerInteract?.()
					}}
					type='button'
				>
					<span
						className={cn(
							'flex size-4 shrink-0 items-center justify-center rounded-full border shadow-xs',
							value !== 'uncompleted' &&
								'border-primary bg-primary text-primary-foreground dark:bg-primary',
							value === 'uncompleted' &&
								!invalid &&
								(surface === 'primary'
									? 'border-primary-foreground'
									: 'border-foreground'),
							invalid &&
								value === 'uncompleted' &&
								'border-red-600 dark:border-red-500'
						)}
					>
						{value === 'uncompleted' ? null : getOptionIcon(value)}
					</span>
					<ChevronDown className='h-3 w-3 text-muted-foreground' />
				</button>
			}
		/>
	)
}
