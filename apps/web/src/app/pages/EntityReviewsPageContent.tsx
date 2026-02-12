import { ChevronDown, Loader2, Plus } from 'lucide-react'
import { type ReactNode, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviews } from '~/features/reviews/api/getReviews'
import { RatingDropdown } from '~/features/reviews/components/RatingDropdown'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import type { ReviewRatingState } from '~/features/reviews/components/ReviewRatingCheckbox'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import type { GetReviewsFilters } from '~/features/reviews/types/api.types'
import type {
	Rating,
	ReviewListItem
} from '~/features/reviews/types/review.types'
import { localDateString } from '~/utils/date'

type EntityType = 'topic' | 'source' | 'practice'

interface EntityReviewsPageContentProps {
	entityId: number
	entityType: EntityType
	navbar: ReactNode
}

function toReviewFilters(
	entityType: EntityType,
	entityId: number
): GetReviewsFilters {
	if (entityType === 'topic') return { topicId: entityId }
	if (entityType === 'source') return { sourceId: entityId }
	return { practiceId: entityId }
}

function splitReviews(reviews: Array<ReviewListItem>) {
	const today = localDateString()
	const uncompletedUnscheduled: Array<ReviewListItem> = []
	const overdue: Array<ReviewListItem> = []
	const todayReviews: Array<ReviewListItem> = []
	const upcoming: Array<ReviewListItem> = []
	const completed: Array<ReviewListItem> = []

	for (const review of reviews) {
		if (review.completed_at) {
			completed.push(review)
			continue
		}

		if (review.scheduled_at || review.effective_date) {
			const date = review.effective_date ?? review.scheduled_at
			if (date && date < today) {
				overdue.push(review)
			} else if (date && date === today) {
				todayReviews.push(review)
			} else {
				upcoming.push(review)
			}
			continue
		}

		uncompletedUnscheduled.push(review)
	}

	const sortByEffectiveDateAsc = (a: ReviewListItem, b: ReviewListItem) =>
		new Date(a.effective_date ?? 0).getTime() -
		new Date(b.effective_date ?? 0).getTime()

	overdue.sort(sortByEffectiveDateAsc)
	todayReviews.sort(sortByEffectiveDateAsc)
	upcoming.sort(sortByEffectiveDateAsc)
	uncompletedUnscheduled.sort((a, b) => {
		return new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
	})
	completed.sort((a, b) => {
		return (
			new Date(b.completed_at ?? b.effective_date ?? 0).getTime() -
			new Date(a.completed_at ?? a.effective_date ?? 0).getTime()
		)
	})

	return {
		uncompletedUnscheduledReviews: uncompletedUnscheduled,
		overdueReviews: overdue,
		todayReviews,
		upcomingReviews: upcoming,
		completedReviews: completed
	}
}

export function EntityReviewsPageContent({
	entityId,
	entityType,
	navbar
}: EntityReviewsPageContentProps) {
	const filters = useMemo(
		() => toReviewFilters(entityType, entityId),
		[entityType, entityId]
	)
	const { data: reviews = [], isLoading } = useReviews(filters)
	const {
		uncompletedUnscheduledReviews,
		overdueReviews,
		todayReviews,
		upcomingReviews,
		completedReviews
	} = useMemo(() => splitReviews(reviews), [reviews])

	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()
	const isCreatingReview = createReviewMutation.isPending

	const createReview = useCallback(
		(completedAt: string | null, rating: Rating | null) => {
			const basePayload = {
				rating,
				description: '',
				scheduled_at: null,
				completed_at: completedAt
			}

			if (entityType === 'topic') {
				return createReviewMutation.mutateAsync({
					...basePayload,
					topic_id: entityId
				})
			}

			if (entityType === 'source') {
				return createReviewMutation.mutateAsync({
					...basePayload,
					source_id: entityId
				})
			}

			return createReviewMutation.mutateAsync({
				...basePayload,
				practice_id: entityId
			})
		},
		[createReviewMutation, entityId, entityType]
	)

	const handleRatingSelect = useCallback(
		async (ratingState: ReviewRatingState) => {
			try {
				const review =
					ratingState === 'uncompleted'
						? await createReview(null, null)
						: await createReview(localDateString(), ratingState)

				toast('Review created', {
					action: {
						label: 'Open',
						onClick: () => openReviewDialog(review.id)
					}
				})
			} catch {
				toast.error('Failed to create review')
			}
		},
		[createReview, openReviewDialog]
	)

	return (
		<div className='flex h-full min-h-0 flex-col'>
			{navbar}
			<div className='flex min-h-0 flex-1'>
				<div className='scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll'>
					<div className='mx-auto w-full max-w-5xl px-6 pt-2 pb-4'>
						<div className='mb-4 flex items-center justify-end'>
							<RatingDropdown
								align='end'
								onSelect={handleRatingSelect}
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
										Review
										<ChevronDown />
									</Button>
								}
							/>
						</div>
						{isLoading ? (
							<LoadingSpinner containerClassName='min-h-56' />
						) : (
							<div className='flex flex-col gap-10'>
								{uncompletedUnscheduledReviews.length > 0 && (
									<div>
										{uncompletedUnscheduledReviews.map(entry => (
											<ReviewItem
												entry={entry}
												key={entry.id}
												onReviewClick={openReviewDialog}
												variant='default'
											/>
										))}
									</div>
								)}
								{overdueReviews.length > 0 && (
									<div>
										<h2 className='mb-3 font-bold text-2xl text-red-600 dark:text-red-400'>
											Overdue
										</h2>
										{overdueReviews.map(entry => (
											<ReviewItem
												entry={entry}
												key={entry.id}
												onReviewClick={openReviewDialog}
												variant='default'
											/>
										))}
									</div>
								)}
								{todayReviews.length > 0 && (
									<div>
										<h2 className='mb-3 font-bold text-2xl text-blue-600 dark:text-blue-400'>
											Today
										</h2>
										{todayReviews.map(entry => (
											<ReviewItem
												entry={entry}
												key={entry.id}
												onReviewClick={openReviewDialog}
												variant='default'
											/>
										))}
									</div>
								)}
								{upcomingReviews.length > 0 && (
									<div>
										<h2 className='mb-3 font-bold text-2xl'>Upcoming</h2>
										{upcomingReviews.map(entry => (
											<ReviewItem
												entry={entry}
												key={entry.id}
												onReviewClick={openReviewDialog}
												variant='default'
											/>
										))}
									</div>
								)}
								{completedReviews.length > 0 && (
									<div>
										<h2 className='mb-3 font-bold text-2xl'>Completed</h2>
										{completedReviews.map(entry => (
											<ReviewItem
												entry={entry}
												key={entry.id}
												onReviewClick={openReviewDialog}
												variant='default'
											/>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
