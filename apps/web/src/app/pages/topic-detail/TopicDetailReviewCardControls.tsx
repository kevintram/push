import { Plus } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'
import { type ReviewCardType } from '~/modules/review-cards/types/review-card.types'

import {
	type TopicDetailReviewCardControlsVariant,
	type TopicDetailReviewCardFilter,
} from './shared'

const FILTER_OPTIONS: Array<{
	label: string
	value: TopicDetailReviewCardFilter
}> = [
	{ label: 'All', value: 'all' },
	{ label: 'Practice', value: 'practice' },
	{ label: 'Flashcard', value: 'flashcard' },
]

function getControlSize(controlsVariant: TopicDetailReviewCardControlsVariant) {
	if (controlsVariant === 'compact') return 'xs'
	if (controlsVariant === 'medium') return 'xs'
	return 'sm'
}

function getControlClassName(
	controlsVariant: TopicDetailReviewCardControlsVariant,
) {
	if (controlsVariant === 'compact') {
		return 'h-5 rounded-4xl px-2 text-xs'
	}

	if (controlsVariant === 'medium') {
		return 'h-6 rounded-full px-2.5 text-xs'
	}

	return 'rounded-full'
}

export function TopicDetailReviewCardFilterControls({
	activeFilter,
	controlsVariant,
	onFilterChange,
}: {
	activeFilter: TopicDetailReviewCardFilter
	controlsVariant: TopicDetailReviewCardControlsVariant
	onFilterChange: (filter: TopicDetailReviewCardFilter) => void
}) {
	return (
		<div className='flex flex-wrap items-center gap-2'>
			{FILTER_OPTIONS.map(option => (
				<Button
					aria-pressed={activeFilter === option.value}
					className={cn(
						'cursor-pointer',
						getControlClassName(controlsVariant),
					)}
					key={option.value}
					onClick={() => onFilterChange(option.value)}
					size={getControlSize(controlsVariant)}
					variant={
						activeFilter === option.value ? 'default' : 'outline'
					}
				>
					{option.label}
				</Button>
			))}
		</div>
	)
}

export function TopicDetailReviewCardAddButton({
	controlsVariant,
	isCreatingReviewCard,
	onAddReviewCard,
}: {
	controlsVariant: TopicDetailReviewCardControlsVariant
	isCreatingReviewCard: boolean
	onAddReviewCard: (type: ReviewCardType) => void
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						className={cn(
							'shrink-0',
							getControlClassName(controlsVariant),
						)}
						disabled={isCreatingReviewCard}
						size={getControlSize(controlsVariant)}
						variant='secondary'
					>
						<Plus />
						Add
					</Button>
				}
			/>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onClick={() => onAddReviewCard('practice')}>
					Practice
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => onAddReviewCard('flashcard')}>
					Flashcard
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
