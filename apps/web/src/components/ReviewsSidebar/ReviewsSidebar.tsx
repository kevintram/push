import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/sidebar'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviews } from '~/features/reviews/api/getReviews'
import { RatingDropdown } from '~/features/reviews/components/RatingDropdown'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import type { ReviewRatingState } from '~/features/reviews/components/ReviewRatingCheckbox'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import type {
	Rating,
	ReviewListItem
} from '~/features/reviews/types/review.types'
import { getReviewCreatedToastDescription } from '~/features/reviews/utils/reviewToastDescription'
import { localDateString } from '~/utils/date'

type EntityType = 'topic' | 'source' | 'practice'

/** Minimal entity type required by the sidebar - just needs an id */
type EntityWithId = { id: number }

interface ReviewsSidebarProps<T extends EntityWithId> {
	entity: T | null | undefined
	entityType: EntityType
	readonly?: boolean
	/** Additional sidebar className (merged with defaults) */
	sidebarClassName?: string
}

export function ReviewsSidebar<T extends EntityWithId>({
	entity,
	entityType,
	readonly = false,
	sidebarClassName = ''
}: ReviewsSidebarProps<T>) {
	const filters = useMemo(() => {
		if (entityType === 'topic') return { topicId: entity?.id }
		if (entityType === 'source') return { sourceId: entity?.id }
		return { practiceId: entity?.id }
	}, [entityType, entity?.id])
	const { data: reviews = [], isLoading } = useReviews(
		entity?.id !== undefined ? filters : undefined
	)
	const { scheduledReviews, unscheduledReviews } = useMemo(() => {
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
				new Date(b.effective_date!).getTime() -
				new Date(a.effective_date!).getTime()
			)
		})

		unscheduled.sort((a, b) => {
			return (
				new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
			)
		})

		return {
			scheduledReviews: scheduled,
			unscheduledReviews: unscheduled
		}
	}, [reviews])

	const navigate = useNavigate()
	const createReviewMutation = useCreateReview()
	const isCreatingReview = createReviewMutation.isPending
	const { openReviewDialog } = useReviewDialog()

	const createReview = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			if (!entity) {
				const entityName =
					entityType === 'topic'
						? 'Topic'
						: entityType === 'source'
							? 'Source'
							: 'Practice'
				throw new Error(`${entityName} not found`)
			}

			const basePayload = {
				rating,
				description: '',
				scheduled_at: null,
				completed_at: completedAt
			}

			let review
			if (entityType === 'topic') {
				review = await createReviewMutation.mutateAsync({
					...basePayload,
					topic_id: entity.id
				})
			} else if (entityType === 'source') {
				review = await createReviewMutation.mutateAsync({
					...basePayload,
					source_id: entity.id
				})
			} else {
				review = await createReviewMutation.mutateAsync({
					...basePayload,
					practice_id: entity.id
				})
			}

			toast('Review created', {
				description: getReviewCreatedToastDescription(review),
				action: {
					label: 'Open',
					onClick: () => {
						if (entityType === 'topic') {
							navigate({
								to: '/topics/$topicId/reviews',
								params: { topicId: entity.id.toString() }
							})
						} else if (entityType === 'source') {
							navigate({
								to: '/sources/$sourceId/reviews',
								params: { sourceId: entity.id.toString() }
							})
						} else {
							navigate({
								to: '/practices/$practiceId/reviews',
								params: { practiceId: entity.id.toString() }
							})
						}
						openReviewDialog(review.id)
					}
				}
			})
		},
		[entity, entityType, createReviewMutation, navigate, openReviewDialog]
	)

	const handleRatingSelect = useCallback(
		async (ratingState: ReviewRatingState) => {
			try {
				if (ratingState === 'uncompleted') {
					await createReview(null, null)
				} else {
					await createReview(localDateString(), ratingState)
				}
			} catch {
				toast.error('Failed to create review')
			}
		},
		[createReview]
	)

	const handleReviewClick = useCallback(
		(reviewId: number) => {
			if (readonly) return
			openReviewDialog(reviewId)
		},
		[readonly, openReviewDialog]
	)

	const baseSidebarClass = 'absolute border-l'
	const combinedSidebarClass = sidebarClassName
		? `${baseSidebarClass} ${sidebarClassName}`
		: baseSidebarClass

	return (
		<Sidebar className={combinedSidebarClass} side='right'>
			<SidebarHeader className='flex flex-col gap-1 pb-0'>
				<div className='flex flex-row items-center justify-between'>
					<h1 className='font-semibold text-lg'>Reviews</h1>
					{!readonly && (
						<Tooltip>
							<RatingDropdown
								align='end'
								onSelect={handleRatingSelect}
								trigger={
									<TooltipTrigger
										render={
											<Button
												disabled={isCreatingReview}
												size='xs'
												variant='secondary'
											>
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
								}
							/>
							<TooltipContent>
								{isCreatingReview ? 'Creating review...' : 'Create new review'}
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</SidebarHeader>
			<SidebarContent className='scrollbar-track-transparent flex h-full flex-col gap-6 overflow-auto overscroll-contain px-2 pb-2'>
				{isLoading ? (
					<LoadingSpinner containerClassName='h-full min-h-48' />
				) : (
					<>
						{/* Unscheduled Reviews Section */}
						{/* @container keeps ReviewItem in compact mode at sidebar widths (no ReviewListHeader needed) */}
						{unscheduledReviews.length > 0 && (
							<div className='@container/review-list flex flex-col'>
								{unscheduledReviews.map(entry => (
									<ReviewItem
										entry={entry}
										key={entry.id}
										onReviewClick={handleReviewClick}
										readonly={readonly}
										variant='default'
									/>
								))}
							</div>
						)}

						{/* Scheduled Reviews Section */}
						{scheduledReviews.length > 0 && (
							<div className='@container/review-list flex flex-col'>
								{scheduledReviews.map(entry => (
									<ReviewItem
										entry={entry}
										key={entry.id}
										onReviewClick={handleReviewClick}
										readonly={readonly}
										variant='default'
									/>
								))}
							</div>
						)}
					</>
				)}
			</SidebarContent>
		</Sidebar>
	)
}
