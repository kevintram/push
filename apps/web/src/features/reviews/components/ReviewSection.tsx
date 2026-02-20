import { ChevronDown } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { CountBadge } from '~/components/ui/count-badge'
import type { ReviewListItem } from '../types/review.types'
import { ReviewItem } from './ReviewItem'
import { ReviewListHeader } from './ReviewListHeader'

type ReviewSectionProps = {
	id: string
	label: string
	dateFormat?: 'relative' | 'short'
	headingClassName?: string
	entries: Array<ReviewListItem>
	isCollapsed: boolean
	onToggleCollapse: (sectionId: string) => void
	onReviewClick: (reviewId: number) => void
}

export function ReviewSection({
	id,
	label,
	dateFormat,
	headingClassName,
	entries,
	isCollapsed,
	onToggleCollapse,
	onReviewClick
}: ReviewSectionProps) {
	return (
		<div className='mb-2'>
			<div className='flex items-center justify-between'>
				<Button
					className='flex items-center gap-2 p-0'
					onClick={() => onToggleCollapse(id)}
					variant='ghost'
				>
					<h2
						className={`flex items-center gap-2 font-bold text-xl ${headingClassName ?? ''}`.trim()}
					>
						{label} <CountBadge count={entries.length} />
					</h2>
					<ChevronDown
						className={`h-5 w-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
					/>
				</Button>
			</div>

			{!isCollapsed && (
				<div className='mt-2 mb-10'>
					{entries.length > 0 ? (
						<div className='@container/review-list'>
							<ReviewListHeader />
							{entries.map(entry => (
								<ReviewItem
									dateFormat={dateFormat}
									entry={entry}
									key={`review-${entry.id}`}
									onReviewClick={onReviewClick}
									variant='default'
								/>
							))}
						</div>
					) : (
						<p className='text-muted-foreground text-sm italic'>No reviews</p>
					)}
				</div>
			)}
		</div>
	)
}
