import { ChevronDown, Shuffle } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
	type StatusBadgeItem,
	StatusBadgeList
} from '~/components/ui/status-badge'
import type {
	ReviewFilter,
	ReviewFocusOrder
} from '~/features/review-cards/types/review-card.types'

const DUE_FILTER_OPTIONS = [
	{ label: 'All', value: 'all' },
	{ label: 'Practice', value: 'practice' },
	{ label: 'Flashcards', value: 'flashcards' }
] as const

type DueHeaderControlsProps = {
	filter: ReviewFilter
	order: ReviewFocusOrder
	onFilterChange: (filter: ReviewFilter) => void
	onOrderChange: (order: ReviewFocusOrder) => void
	onShuffle: () => void
	showFocusOrderControls: boolean
}

type DueQueueStatusBadgesProps = {
	dueTodayCount: number
	newCount: number
	overdueCount: number
}

function buildDueQueueStatusBadges({
	dueTodayCount,
	newCount,
	overdueCount
}: DueQueueStatusBadgesProps): Array<StatusBadgeItem> {
	const badges: Array<StatusBadgeItem> = []

	if (overdueCount > 0) {
		badges.push({
			label: `${overdueCount} Overdue`,
			tone: 'danger'
		})
	}

	if (dueTodayCount > 0) {
		badges.push({
			label: `${dueTodayCount} Due`,
			tone: 'info'
		})
	}

	if (newCount > 0) {
		badges.push({
			label: `${newCount} New`,
			tone: 'neutral'
		})
	}

	return badges
}

export function DueQueueStatusBadges(props: DueQueueStatusBadgesProps) {
	return (
		<StatusBadgeList
			badges={buildDueQueueStatusBadges(props)}
			className='shrink-0'
		/>
	)
}

export function DueHeaderControls({
	filter,
	order,
	onFilterChange,
	onOrderChange,
	onShuffle,
	showFocusOrderControls
}: DueHeaderControlsProps) {
	const orderLabel = order === 'random' ? 'Random' : 'Due date'

	return (
		<div className='flex flex-wrap items-center gap-1.5'>
			{DUE_FILTER_OPTIONS.map(option => {
				const isActive = filter === option.value
				return (
					<Button
						aria-pressed={isActive}
						className='h-6 rounded-full px-2 text-xs'
						key={option.value}
						onClick={() => {
							if (!isActive) onFilterChange(option.value)
						}}
						size='xs'
						type='button'
						variant={isActive ? 'default' : 'outline'}
					>
						{option.label}
					</Button>
				)
			})}
			{showFocusOrderControls ? (
				<>
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
									{orderLabel}
									<ChevronDown />
								</Button>
							}
						/>
						<DropdownMenuContent align='start'>
							<DropdownMenuGroup>
								<DropdownMenuLabel>Order by</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => onOrderChange('due-date')}>
									Due date
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onOrderChange('random')}>
									Random
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					{order === 'random' && (
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
					)}
				</>
			) : null}
		</div>
	)
}
