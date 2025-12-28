import { ChevronDown, Circle } from 'lucide-react'
import type { ReactNode } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { cn } from '~/lib/utils'
import { getRatingIcon } from '~/utils/getRatingIcon'
import type { Rating } from '../types/review.types'

export type ReviewRatingState = 'uncompleted' | Rating

interface ReviewRatingDropdownProps {
	value: ReviewRatingState
	onChange: (value: ReviewRatingState) => void
	disabled?: boolean
	className?: string
	invalid?: boolean
}

const ratingOptions: Array<{ value: ReviewRatingState; label: string }> = [
	{ value: 'uncompleted', label: 'Uncompleted' },
	{ value: 'miss', label: 'Miss' },
	{ value: 'hard', label: 'Hard' },
	{ value: 'good', label: 'Good' },
	{ value: 'easy', label: 'Easy' }
]

function EmptyRatingIcon() {
	return <Circle className='h-3 w-3' />
}

function getOptionIcon(option: ReviewRatingState): ReactNode {
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
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true} disabled={disabled}>
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
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' side='bottom' sideOffset={2}>
				<DropdownMenuRadioGroup
					onValueChange={nextValue => onChange(nextValue as ReviewRatingState)}
					value={value}
				>
					{ratingOptions.map(option => (
						<div key={option.value}>
							<DropdownMenuRadioItem
								onClick={event => event.stopPropagation()}
								onSelect={event => event.stopPropagation()}
								value={option.value}
							>
								<div className='flex w-full items-center text-muted-foreground'>
									{getOptionIcon(option.value)}
									<span className='ml-2 flex flex-1'>{option.label}</span>
								</div>
							</DropdownMenuRadioItem>
							{option.value === 'uncompleted' ? (
								<DropdownMenuSeparator />
							) : null}
						</div>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
