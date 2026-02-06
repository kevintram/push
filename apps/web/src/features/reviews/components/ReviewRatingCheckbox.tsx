import { ChevronDown, Circle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'
import { getRatingIcon } from '~/utils/getRatingIcon'
import type { Rating } from '../types/review.types'
import { RatingDropdown } from './RatingDropdown'

export type ReviewRatingState = 'uncompleted' | Rating

interface ReviewRatingDropdownProps {
	value: ReviewRatingState
	onChange: (value: ReviewRatingState) => void
	disabled?: boolean
	className?: string
	invalid?: boolean
}

export const ratingOptions: Array<{ value: ReviewRatingState; label: string }> =
	[
		{ value: 'uncompleted', label: 'Uncompleted' },
		{ value: 'miss', label: 'Miss' },
		{ value: 'hard', label: 'Hard' },
		{ value: 'good', label: 'Good' },
		{ value: 'easy', label: 'Easy' }
	]

function EmptyRatingIcon() {
	return <Circle className='h-3 w-3' />
}

export function getOptionIcon(option: ReviewRatingState): ReactNode {
	if (option === 'uncompleted') return <EmptyRatingIcon />
	return getRatingIcon(option)
}

export function ReviewRatingCheckbox({
	value,
	onChange,
	disabled = false,
	className,
	invalid = false
}: ReviewRatingDropdownProps) {
	return (
		<RatingDropdown
			onSelect={onChange}
			trigger={
				<button
					aria-label='Set review status'
					className={cn(
						'flex cursor-pointer items-center gap-0.5 rounded-md border p-1 outline-none transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
						className
					)}
					disabled={disabled}
					onClick={event => event.stopPropagation()}
					type='button'
				>
					<span
						className={cn(
							'flex size-4 shrink-0 items-center justify-center rounded-full border border-input shadow-xs dark:bg-input/30',
							value !== 'uncompleted' &&
								'border-primary bg-primary text-primary-foreground dark:bg-primary',
							invalid &&
								value === 'uncompleted' &&
								'border-red-600 dark:border-red-500'
						)}
					>
						{value === 'uncompleted' ? null : getRatingIcon(value)}
					</span>
					<ChevronDown className='h-3 w-3 text-muted-foreground' />
				</button>
			}
		/>
	)
}
