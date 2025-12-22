import { ChevronDown } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import type { ReviewSession } from '../types/review.types'
import { ReviewSessionItem } from './ReviewSessionItem'

type ReviewSectionProps = {
	id: string
	label: string
	headingClassName?: string
	entries: Array<ReviewSession>
	isCollapsed: boolean
	onToggleCollapse: (sectionId: string) => void
	onReviewClick: (reviewId: number) => void
}

export function ReviewSection({
	id,
	label,
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
					<h2 className={`font-bold text-xl ${headingClassName ?? ''}`.trim()}>
						{label}{' '}
						<span className='text-muted-foreground'>({entries.length})</span>
					</h2>
					<ChevronDown
						className={`h-5 w-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
					/>
				</Button>
			</div>

			{!isCollapsed && (
				<div className='mt-2 mb-10 ml-5 border-border border-l-2 pl-2'>
					{entries.length > 0 ? (
						<div className='px-4'>
							{entries.map(entry => (
								<ReviewSessionItem
									entry={entry}
									key={entry.id}
									onReviewClick={onReviewClick}
								/>
							))}
						</div>
					) : (
						<p className='px-4 text-muted-foreground text-sm italic'>
							No reviews
						</p>
					)}
				</div>
			)}
		</div>
	)
}
