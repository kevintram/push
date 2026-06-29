import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

import {
	type TopicDetailReviewCardControlsVariant,
	type TopicDetailReviewCardFilter,
} from './shared'
import {
	getReviewCardControlClassName,
	getReviewCardControlSize,
} from './topicDetailReviewCardControlStyles'

const FILTER_OPTIONS: Array<{
	label: string
	value: TopicDetailReviewCardFilter
}> = [
	{ label: 'All', value: 'all' },
	{ label: 'Practice', value: 'practice' },
	{ label: 'Flashcard', value: 'flashcard' },
]

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
						getReviewCardControlClassName(controlsVariant),
					)}
					key={option.value}
					onClick={() => onFilterChange(option.value)}
					size={getReviewCardControlSize(controlsVariant)}
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
