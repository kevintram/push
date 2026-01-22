import { Loader2, Plus, Square, SquareCheck } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import { Skeleton } from '~/components/ui/Skeleton'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviews } from '~/features/reviews/api/getReviews'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import type {
	Rating,
	ReviewListItem
} from '~/features/reviews/types/review.types'
import type { LearnableBase } from '~/models/learnable.types'

type EntityType = 'topic' | 'source'

interface LearnableReviewsSidebarProps<T extends LearnableBase> {
	entity: T | null | undefined
	entityType: EntityType
	readonly?: boolean
	/** Additional sidebar className (merged with defaults) */
	sidebarClassName?: string
}

export function LearnableReviewsSidebar<T extends LearnableBase>({
	entity,
	entityType,
	readonly = false,
	sidebarClassName = ''
}: LearnableReviewsSidebarProps<T>) {
	const filters = useMemo(
		() =>
			entityType === 'topic'
				? { topicId: entity?.id }
				: { sourceId: entity?.id },
		[entityType, entity?.id]
	)
	const { data: reviews = [], isLoading } = useReviews(
		entity?.id !== undefined ? filters : undefined
	)
	const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

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
				new Date(a.effective_date!).getTime() -
				new Date(b.effective_date!).getTime()
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

	const createReviewMutation = useCreateReview()
	const isCreatingReview = createReviewMutation.isPending

	const createReview = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			if (!entity) {
				throw new Error(
					`${entityType === 'topic' ? 'Topic' : 'Source'} not found`
				)
			}

			const basePayload = {
				rating,
				description: '',
				scheduled_at: null,
				completed_at: completedAt
			}

			const payload =
				entityType === 'topic'
					? { ...basePayload, topic_id: entity.id }
					: { ...basePayload, source_id: entity.id }

			const review = await createReviewMutation.mutateAsync(payload)

			// Open the review dialog with the newly created review
			setSelectedReviewId(review.id)
			setIsDialogOpen(true)
		},
		[entity, entityType, createReviewMutation]
	)

	const handleLogReviewNow = useCallback(async () => {
		const today = new Date().toISOString().split('T')[0] ?? '' // YYYY-MM-DD format
		await createReview(today, 'good')
	}, [createReview])

	const handleNewReviewForLater = useCallback(async () => {
		await createReview(null, null)
	}, [createReview])

	const handleReviewClick = useCallback(
		(reviewId: number) => {
			if (readonly) return
			setSelectedReviewId(reviewId)
			setIsDialogOpen(true)
		},
		[readonly]
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
						<DropdownMenu>
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<DropdownMenuTrigger asChild={true}>
										<Button
											disabled={isCreatingReview}
											size='sm'
											variant='ghost'
										>
											{isCreatingReview ? (
												<Loader2 className='animate-spin' />
											) : (
												<Plus />
											)}
										</Button>
									</DropdownMenuTrigger>
								</TooltipTrigger>
								<TooltipContent>
									{isCreatingReview
										? 'Creating review...'
										: 'Create new review'}
								</TooltipContent>
							</Tooltip>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									disabled={isCreatingReview}
									onClick={handleLogReviewNow}
								>
									<SquareCheck />
									Log review now
								</DropdownMenuItem>
								<DropdownMenuItem
									disabled={isCreatingReview}
									onClick={handleNewReviewForLater}
								>
									<Square />
									For later
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</SidebarHeader>
			<SidebarContent className='scrollbar-track-transparent flex h-full flex-col gap-6 overflow-auto overscroll-contain px-2 pb-2'>
				{isLoading ? (
					<div className='flex flex-col gap-4'>
						{[0, 1, 2, 3, 4].map(i => (
							<div
								className='flex flex-col gap-2 rounded-lg p-3'
								key={`skeleton-review-${i}`}
							>
								<div className='flex items-start justify-between'>
									<Skeleton className='h-5 w-3/4' />
									<Skeleton className='h-5 w-16' />
								</div>
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-2/3' />
								<div className='mt-2 flex gap-2'>
									<Skeleton className='h-5 w-16 rounded-full' />
									<Skeleton className='h-5 w-20 rounded-full' />
								</div>
							</div>
						))}
					</div>
				) : (
					<>
						{/* Scheduled Reviews Section */}
						{scheduledReviews.length > 0 && (
							<div className='flex flex-col'>
								{scheduledReviews.map(entry => (
									<ReviewItem
										entry={entry}
										key={entry.id}
										onReviewClick={handleReviewClick}
										readonly={readonly}
										variant='session'
									/>
								))}
							</div>
						)}

						{/* Unscheduled Reviews Section */}
						{unscheduledReviews.length > 0 && (
							<div className='flex flex-col'>
								<div className='flex flex-row items-center gap-2 pt-6'>
									<h2 className='font-semibold text-sm'>Unscheduled</h2>
								</div>
								<div className='flex flex-col'>
									{unscheduledReviews.map(entry => (
										<ReviewItem
											entry={entry}
											key={entry.id}
											onReviewClick={handleReviewClick}
											readonly={readonly}
											variant='session'
										/>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</SidebarContent>
			<ReviewDialog
				onOpenChange={setIsDialogOpen}
				open={isDialogOpen}
				reviewId={selectedReviewId}
			/>
		</Sidebar>
	)
}
