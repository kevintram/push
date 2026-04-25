import { Shuffle } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import type {
	ReviewFilter,
	ReviewFocusOrder
} from '~/features/review-cards/types/review-card.types'
import { cn } from '~/lib/utils'

const REVIEW_FILTER_OPTIONS = [
	{ label: 'All', value: 'all' },
	{ label: 'Practice', value: 'practice' },
	{ label: 'Flashcards', value: 'flashcards' }
] as const

type ReviewHeaderControlsProps = {
	filter: ReviewFilter
	order: ReviewFocusOrder
	onFilterChange: (filter: ReviewFilter) => void
	onOrderChange: (order: ReviewFocusOrder) => void
	onShuffle: () => void
}

type ReviewStatusBadgesProps = {
	dueTodayCount: number
	overdueCount: number
}

export function ReviewStatusBadges({
	dueTodayCount,
	overdueCount
}: ReviewStatusBadgesProps) {
	const badgeClassName =
		'inline-flex h-5 items-center rounded-full px-1.5 font-medium text-[10px] leading-none'

	return (
		<span className='flex shrink-0 items-center gap-1'>
			<span
				className={cn(
					badgeClassName,
					'bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
				)}
			>
				{overdueCount} Overdue
			</span>
			<span
				className={cn(
					badgeClassName,
					'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
				)}
			>
				Due {dueTodayCount}
			</span>
		</span>
	)
}

export function ReviewHeaderControls({
	filter,
	order,
	onFilterChange,
	onOrderChange,
	onShuffle
}: ReviewHeaderControlsProps) {
	const orderLabel = order === 'random' ? 'Random' : 'Due date'

	return (
		<div className='flex flex-wrap items-center gap-1.5'>
			<Tabs
				onValueChange={value => onFilterChange(value as ReviewFilter)}
				value={filter}
			>
				<TabsList variant='badge'>
					{REVIEW_FILTER_OPTIONS.map(option => (
						<TabsTrigger
							badgeStyle={true}
							key={option.value}
							value={option.value}
						>
							{option.label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label={`Order by: ${orderLabel}`}
							className='h-6 rounded-full px-2 text-xs'
							size='xs'
							type='button'
							variant='outline'
						>
							Order by
						</Button>
					}
				/>
				<DropdownMenuContent align='start'>
					<DropdownMenuItem onClick={() => onOrderChange('due-date')}>
						Due date
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => onOrderChange('random')}>
						Random
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Button
				aria-label='Shuffle focus order'
				className='h-6 rounded-full px-2 text-xs'
				onClick={onShuffle}
				size='xs'
				type='button'
				variant='outline'
			>
				<Shuffle />
				Shuffle
			</Button>
		</div>
	)
}
