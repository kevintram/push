import { ChevronDown, Shuffle } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { ReviewStatusDots } from '~/components/ui/review-status-dots'
import {
	type StatusBadgeItem,
	StatusBadgeList,
} from '~/components/ui/status-badge'
import {
	type ReviewFilter,
	type ReviewFocusOrder,
} from '~/modules/review-cards/types/review-card.types'

const DUE_FILTER_OPTIONS = [
	{ label: 'All', value: 'all' },
	{ label: 'Practice', value: 'practice' },
	{ label: 'Flashcards', value: 'flashcards' },
] as const

type DueHeaderControlsProps = {
	filterStatusCounts: DueFilterStatusCountsByFilter
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

type DueFilterStatusCounts = {
	dueTodayCount: number
	newCount: number
	overdueCount: number
}

type StatusFilter = Exclude<ReviewFilter, 'all'>

type DueFilterStatusCountsByFilter = Record<StatusFilter, DueFilterStatusCounts>

function buildDueQueueStatusBadges({
	dueTodayCount,
	newCount,
	overdueCount,
}: DueQueueStatusBadgesProps): Array<StatusBadgeItem> {
	const badges: Array<StatusBadgeItem> = []

	if (overdueCount > 0) {
		badges.push({
			label: `${overdueCount} Overdue`,
			tone: 'danger',
		})
	}

	if (dueTodayCount > 0) {
		badges.push({
			label: `${dueTodayCount} Due`,
			tone: 'info',
		})
	}

	if (newCount > 0) {
		badges.push({
			label: `${newCount} New`,
			tone: 'neutral',
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

function formatStatusParts(parts: Array<string>) {
	if (parts.length <= 1) return parts[0] ?? ''
	if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
	return `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`
}

function buildFilterStatusLabel(
	label: string,
	counts: DueFilterStatusCounts | undefined,
) {
	const parts: Array<string> = []

	if (counts?.overdueCount) parts.push('has overdue reviews')
	if (counts?.dueTodayCount) parts.push('reviews due today')
	if (counts?.newCount) parts.push('new review cards')

	const summary = formatStatusParts(parts)
	return summary ? `${label} filter, ${summary}` : `${label} filter`
}

export function DueHeaderControls({
	filter,
	filterStatusCounts,
	order,
	onFilterChange,
	onOrderChange,
	onShuffle,
	showFocusOrderControls,
}: DueHeaderControlsProps) {
	const orderLabel = order === 'random' ? 'Random' : 'Due date'

	return (
		<div className='flex flex-wrap items-center gap-1.5'>
			{DUE_FILTER_OPTIONS.map(option => {
				const isActive = filter === option.value
				const statusCounts =
					option.value === 'all'
						? undefined
						: filterStatusCounts[option.value]
				return (
					<Button
						aria-label={buildFilterStatusLabel(
							option.label,
							statusCounts,
						)}
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
						{statusCounts ? (
							<ReviewStatusDots
								dueTodayCount={statusCounts.dueTodayCount}
								neutralVariant='solid'
								overdueCount={statusCounts.overdueCount}
								pendingCount={statusCounts.newCount}
								surfaceContext={
									isActive ? 'primary' : 'default'
								}
								testIdPrefix={`due-filter-${option.value}`}
							/>
						) : null}
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
								<DropdownMenuItem
									onClick={() => onOrderChange('due-date')}
								>
									Due date
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => onOrderChange('random')}
								>
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
