import { ReviewItem } from '~/modules/reviews/components/ReviewItem'
import { ReviewListHeader } from '~/modules/reviews/components/ReviewListHeader'
import { type ReviewListItem } from '~/modules/reviews/types/review.types'

type ReviewCardDetailReviewSectionProps = {
	entries: Array<ReviewListItem>
	onOpenReviewDialog: (reviewId: number) => void
	title: string | null
	titleClassName: string
}

export function ReviewCardDetailReviewSection({
	entries,
	onOpenReviewDialog,
	title,
	titleClassName,
}: ReviewCardDetailReviewSectionProps) {
	if (entries.length === 0) return null

	return (
		<div>
			{title ? (
				<h2 className={`mb-3 font-bold text-2xl ${titleClassName}`}>
					{title}
				</h2>
			) : null}
			<div className='@container/review-list'>
				<ReviewListHeader showCardColumn={false} />
				{entries.map(entry => (
					<ReviewItem
						entry={entry}
						key={entry.id}
						onReviewClick={onOpenReviewDialog}
						showCardColumn={false}
						variant='default'
					/>
				))}
			</div>
		</div>
	)
}
