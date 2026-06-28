import { ChevronDown, Loader2, Plus } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { RatingDropdown } from '~/modules/reviews/components/RatingDropdown'
import { type ReviewRatingState } from '~/modules/reviews/components/reviewRatingOptions'
import { type ReviewListItem } from '~/modules/reviews/types/review.types'

import { ReviewCardDetailReviewSection } from './ReviewCardDetailReviewSection'

type ReviewCardDetailReviewsTabProps = {
	completedReviews: Array<ReviewListItem>
	isCreatingReview: boolean
	isLoading: boolean
	onOpenReviewDialog: (reviewId: number) => void
	onSelectRating: (ratingState: ReviewRatingState) => Promise<void>
	overdueReviews: Array<ReviewListItem>
	todayReviews: Array<ReviewListItem>
	uncompletedUnscheduledReviews: Array<ReviewListItem>
	upcomingReviews: Array<ReviewListItem>
}

export function ReviewCardDetailReviewsTab({
	completedReviews,
	isCreatingReview,
	isLoading,
	onOpenReviewDialog,
	onSelectRating,
	overdueReviews,
	todayReviews,
	uncompletedUnscheduledReviews,
	upcomingReviews,
}: ReviewCardDetailReviewsTabProps) {
	if (isLoading) {
		return <LoadingSpinner containerClassName='min-h-40 py-2' />
	}

	return (
		<div className='space-y-6 py-2'>
			<div className='flex items-center justify-end'>
				<RatingDropdown
					align='end'
					onSelect={onSelectRating}
					trigger={
						<Button
							className='rounded-full'
							disabled={isCreatingReview}
							size='sm'
							variant='default'
						>
							{isCreatingReview ? (
								<Loader2 className='animate-spin' />
							) : (
								<Plus />
							)}
							Create review
							<ChevronDown />
						</Button>
					}
				/>
			</div>
			{uncompletedUnscheduledReviews.length === 0 &&
			overdueReviews.length === 0 &&
			todayReviews.length === 0 &&
			upcomingReviews.length === 0 &&
			completedReviews.length === 0 ? null : (
				<div className='flex flex-col gap-10'>
					<ReviewCardDetailReviewSection
						entries={uncompletedUnscheduledReviews}
						onOpenReviewDialog={onOpenReviewDialog}
						title={null}
						titleClassName=''
					/>
					<ReviewCardDetailReviewSection
						entries={overdueReviews}
						onOpenReviewDialog={onOpenReviewDialog}
						title='Overdue'
						titleClassName='text-red-600 dark:text-red-400'
					/>
					<ReviewCardDetailReviewSection
						entries={todayReviews}
						onOpenReviewDialog={onOpenReviewDialog}
						title='Today'
						titleClassName='text-blue-600 dark:text-blue-400'
					/>
					<ReviewCardDetailReviewSection
						entries={upcomingReviews}
						onOpenReviewDialog={onOpenReviewDialog}
						title='Upcoming'
						titleClassName=''
					/>
					<ReviewCardDetailReviewSection
						entries={completedReviews}
						onOpenReviewDialog={onOpenReviewDialog}
						title='Completed'
						titleClassName=''
					/>
				</div>
			)}
		</div>
	)
}
