import { BookOpen, ChevronDown, Loader2, Plus } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { PageLayout } from '~/app/layouts/PageLayout'
import { Button } from '~/components/ui/Button'
import { Skeleton } from '~/components/ui/Skeleton'
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
	entityName: string
	onBack: () => void
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
	const scheduled: Array<ReviewListItem> = []
	const unscheduled: Array<ReviewListItem> = []

	for (const review of reviews) {
		if (review.effective_date) {
			scheduled.push(review)
		} else {
			unscheduled.push(review)
		}
	}

	scheduled.sort((a, b) => {
		return (
			new Date(b.effective_date ?? 0).getTime() -
			new Date(a.effective_date ?? 0).getTime()
		)
	})
	unscheduled.sort((a, b) => {
		return new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
	})

	return {
		scheduledReviews: scheduled,
		unscheduledReviews: unscheduled
	}
}

export function EntityReviewsPageContent({
	entityId,
	entityType,
	entityName,
	onBack
}: EntityReviewsPageContentProps) {
	const filters = useMemo(
		() => toReviewFilters(entityType, entityId),
		[entityType, entityId]
	)
	const { data: reviews = [], isLoading } = useReviews(filters)
	const { scheduledReviews, unscheduledReviews } = useMemo(
		() => splitReviews(reviews),
		[reviews]
	)

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
		<PageLayout>
			<PageLayout.Header icon={BookOpen} title='Reviews'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<div className='min-w-0'>
						<p className='truncate text-muted-foreground text-sm'>
							{entityName}
						</p>
					</div>
					<div className='flex items-center gap-2'>
						<Button onClick={onBack} size='sm' variant='ghost'>
							Back
						</Button>
						<RatingDropdown
							align='end'
							onSelect={handleRatingSelect}
							trigger={
								<Button disabled={isCreatingReview} size='sm' variant='outline'>
									{isCreatingReview ? (
										<Loader2 className='animate-spin' />
									) : (
										<Plus />
									)}
									Add
									<ChevronDown />
								</Button>
							}
						/>
					</div>
				</div>
			</PageLayout.Header>
			<PageLayout.Content>
				{isLoading ? (
					<div className='flex flex-col gap-2'>
						<Skeleton className='h-20 w-full' />
						<Skeleton className='h-20 w-full' />
						<Skeleton className='h-20 w-full' />
					</div>
				) : (
					<div className='space-y-6'>
						<div>
							<h2 className='mb-2 font-semibold text-sm'>
								Unscheduled ({unscheduledReviews.length})
							</h2>
							{unscheduledReviews.length === 0 ? (
								<p className='text-muted-foreground text-sm italic'>
									No unscheduled reviews.
								</p>
							) : (
								<div>
									{unscheduledReviews.map(entry => (
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
						<div>
							<h2 className='mb-2 font-semibold text-sm'>
								Scheduled ({scheduledReviews.length})
							</h2>
							{scheduledReviews.length === 0 ? (
								<p className='text-muted-foreground text-sm italic'>
									No scheduled reviews.
								</p>
							) : (
								<div>
									{scheduledReviews.map(entry => (
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
					</div>
				)}
			</PageLayout.Content>
		</PageLayout>
	)
}
