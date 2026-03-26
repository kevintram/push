import { Badge } from '~/components/ui/badge'
import type { TopicDetailReviewCardFilter } from './shared'

const FILTER_OPTIONS: Array<{
	label: string
	value: TopicDetailReviewCardFilter
}> = [
	{ label: 'All', value: 'all' },
	{ label: 'Practice', value: 'practice' },
	{ label: 'Flashcard', value: 'flashcard' }
]

export function TopicDocumentReviewCardFilter({
	activeFilter,
	onFilterChange
}: {
	activeFilter: TopicDetailReviewCardFilter
	onFilterChange: (filter: TopicDetailReviewCardFilter) => void
}) {
	return (
		<div className='flex flex-wrap items-center gap-2'>
			{FILTER_OPTIONS.map(option => (
				<Badge
					className='cursor-pointer'
					key={option.value}
					onClick={() => onFilterChange(option.value)}
					variant={activeFilter === option.value ? 'default' : 'outline'}
				>
					{option.label}
				</Badge>
			))}
		</div>
	)
}
