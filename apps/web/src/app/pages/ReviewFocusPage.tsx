import { useNavigate } from '@tanstack/react-router'
import {
	ArrowLeft,
	ArrowRight,
	BookOpenCheck,
	Loader2,
	Shuffle,
	Sunset
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageLayout } from '~/app/layouts/PageLayout'
import { useReviewFocusStream } from '~/app/pages/review/useReviewFocusStream'
import { ReviewCardDetailSurface } from '~/app/pages/review-card-detail/ReviewCardDetailSurface'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useUpdateReviewCard } from '~/features/review-cards/api/updateReviewCard'
import { RetireReviewCardDialog } from '~/features/review-cards/components/RetireReviewCardDialog'
import {
	getStoredReviewViewPreference,
	persistReviewViewPreference
} from '~/features/review-cards/reviewQueueViewPreferences'
import type {
	ReviewCardQueueItem,
	ReviewFilter,
	ReviewFocusOrder
} from '~/features/review-cards/types/review-card.types'
import { hasScheduledDueReviews } from '~/features/review-cards/utils/hasScheduledDueReviews'
import { useCreateReview } from '~/features/reviews/api/createReview'
import type { Rating } from '~/features/reviews/types/review.types'
import { localDateString } from '~/utils/date'
import { getRatingIcon } from '~/utils/getRatingIcon'

const RATING_OPTIONS: Array<{ label: string; value: Exclude<Rating, null> }> = [
	{ label: 'Miss', value: 'miss' },
	{ label: 'Hard', value: 'hard' },
	{ label: 'Good', value: 'good' },
	{ label: 'Easy', value: 'easy' }
]

function makeShuffleSeed() {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function buildFocusSearch({
	filter,
	order,
	shuffle
}: {
	filter: ReviewFilter
	order: ReviewFocusOrder
	shuffle?: string
}) {
	return {
		filter,
		order,
		shuffle: order === 'random' ? shuffle : undefined
	}
}

export function ReviewFocusPage({
	filter,
	order,
	reviewCardId,
	shuffle
}: {
	filter: ReviewFilter
	order: ReviewFocusOrder
	reviewCardId?: number
	shuffle?: string
}) {
	const navigate = useNavigate()
	const stream = useReviewFocusStream({
		activeReviewCardId: reviewCardId,
		filter,
		order,
		shuffle
	})
	const createReviewMutation = useCreateReview()
	const updateReviewCardMutation = useUpdateReviewCard()
	const [isRetireDialogOpen, setIsRetireDialogOpen] = useState(false)
	const activeCard = stream.activeItem?.card ?? null
	const activeReviewCardId = activeCard?.id ?? reviewCardId

	function navigateToFocus(
		search: ReturnType<typeof buildFocusSearch>,
		options?: { replace?: boolean }
	) {
		if (reviewCardId == null) {
			navigate({ to: '/review/focus', search, replace: options?.replace })
			return
		}
		navigate({
			to: '/review/focus/$reviewCardId',
			params: { reviewCardId: reviewCardId.toString() },
			search,
			replace: options?.replace
		})
	}

	function navigateToFocusRoot() {
		navigate({
			to: '/review/focus',
			search: buildFocusSearch({ filter, order, shuffle })
		})
	}

	useEffect(() => {
		persistReviewViewPreference({
			...getStoredReviewViewPreference(),
			filter,
			focusOrder: order
		})
	}, [filter, order])

	useEffect(() => {
		if (stream.isLoading || reviewCardId != null) return
		if (order === 'random' && shuffle == null) return
		const firstItem = stream.firstStreamItem
		if (!firstItem) return
		navigate({
			to: '/review/focus/$reviewCardId',
			params: { reviewCardId: firstItem.card.id.toString() },
			search: buildFocusSearch({ filter, order, shuffle })
		})
	}, [
		filter,
		navigate,
		order,
		reviewCardId,
		shuffle,
		stream.firstStreamItem,
		stream.isLoading
	])

	useEffect(() => {
		if (order !== 'random' || shuffle != null) return
		navigateToFocus(
			buildFocusSearch({ filter, order, shuffle: makeShuffleSeed() }),
			{ replace: true }
		)
		// biome-ignore lint/correctness/useExhaustiveDependencies: navigateToFocus closes over reviewCardId/navigate
	}, [filter, order, reviewCardId, shuffle])

	useEffect(() => {
		setIsRetireDialogOpen(false)
	}, [activeReviewCardId])

	function navigateToItem(item: ReviewCardQueueItem | null) {
		if (!item) return
		navigate({
			to: '/review/focus/$reviewCardId',
			params: { reviewCardId: item.card.id.toString() },
			search: buildFocusSearch({ filter, order, shuffle })
		})
	}

	async function rateCard(rating: Exclude<Rating, null>) {
		if (!activeCard || createReviewMutation.isPending) return

		try {
			await createReviewMutation.mutateAsync({
				review_card_id: activeCard.id,
				rating,
				completed_at: localDateString()
			})
			if (stream.nextItem) {
				navigateToItem(stream.nextItem)
			} else {
				navigateToFocusRoot()
			}
		} catch {
			toast.error('Failed to record review')
		}
	}

	async function confirmToggleRetired() {
		if (!activeCard) return
		try {
			await updateReviewCardMutation.mutateAsync({
				id: activeCard.id,
				retired: !activeCard.retired
			})
			setIsRetireDialogOpen(false)
			if (stream.nextItem) {
				navigateToItem(stream.nextItem)
			} else {
				navigateToFocusRoot()
			}
		} catch {
			toast.error('Failed to update review card')
		}
	}

	function toggleRetired() {
		if (!activeCard) return
		if (!activeCard.retired && hasScheduledDueReviews(activeCard)) {
			setIsRetireDialogOpen(true)
			return
		}
		confirmToggleRetired().catch(() => {})
	}

	function handleSeeReviews() {
		if (!activeCard) return
		setIsRetireDialogOpen(false)
		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: activeCard.id.toString() },
			search: { tab: 'reviews' }
		})
	}

	function handleOrderChange(nextOrder: ReviewFocusOrder) {
		navigateToFocus(
			buildFocusSearch({
				filter,
				order: nextOrder,
				shuffle:
					nextOrder === 'random' ? (shuffle ?? makeShuffleSeed()) : undefined
			})
		)
	}

	function handleShuffle() {
		navigateToFocus(
			buildFocusSearch({
				filter,
				order: 'random',
				shuffle: makeShuffleSeed()
			})
		)
	}

	function handleContinueReviewing() {
		navigateToItem(stream.firstFutureItem)
	}

	function handleSeeUpcoming() {
		navigate({
			to: '/review',
			search: { filter }
		})
	}

	const orderLabel = order === 'random' ? 'Random' : 'Due date'
	const isRetirePending = updateReviewCardMutation.isPending
	const retireIcon = isRetirePending ? (
		<Loader2 className='animate-spin' />
	) : (
		<Sunset />
	)

	return (
		<PageLayout>
			<PageLayout.Header
				actions={
					<div className='flex items-center gap-2'>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button size='sm' type='button' variant='outline'>
										Order by: {orderLabel}
									</Button>
								}
							/>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem onClick={() => handleOrderChange('due-date')}>
									Due date
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleOrderChange('random')}>
									Random
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Button
							aria-label='Shuffle focus order'
							onClick={handleShuffle}
							size='sm'
							type='button'
							variant='outline'
						>
							<Shuffle className='size-4' />
							Shuffle
						</Button>
					</div>
				}
				icon={BookOpenCheck}
				title='Reviews'
			/>
			<PageLayout.Content className='flex min-h-[calc(100vh-9rem)] max-w-screen flex-col px-2.5 py-2.5 pb-3'>
				{stream.isLoading ? (
					<LoadingSpinner containerClassName='min-h-64' />
				) : activeReviewCardId == null ? (
					<Empty className='min-h-64'>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<BookOpenCheck />
							</EmptyMedia>
							<EmptyTitle>You're all caught up!</EmptyTitle>
							<EmptyDescription>
								There are no overdue, due today, or new cards in this review
								queue.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<div className='flex flex-wrap justify-center gap-2'>
								<Button
									disabled={stream.firstFutureItem == null}
									onClick={handleContinueReviewing}
									type='button'
								>
									Continue reviewing
								</Button>
								<Button
									onClick={handleSeeUpcoming}
									type='button'
									variant='outline'
								>
									See upcoming
								</Button>
							</div>
						</EmptyContent>
					</Empty>
				) : (
					<div className='flex min-h-0 flex-1 flex-col gap-3'>
						<div className='min-h-0 flex-1'>
							<ReviewCardDetailSurface
								mode='contained'
								reviewCardId={activeReviewCardId}
							/>
						</div>
						<footer className='flex shrink-0 flex-col gap-3 border-t bg-background/80 pt-3 sm:flex-row sm:items-center sm:justify-between'>
							<div className='flex flex-wrap items-center gap-2'>
								{RATING_OPTIONS.map(option => (
									<Button
										disabled={
											createReviewMutation.isPending || activeCard == null
										}
										key={option.value}
										onClick={() => rateCard(option.value)}
										type='button'
										variant='outline'
									>
										{getRatingIcon(option.value)}
										{option.label}
									</Button>
								))}
							</div>
							<div className='flex flex-wrap items-center justify-start gap-2 sm:justify-end'>
								<Button
									aria-label='Retire this item'
									disabled={activeCard == null || isRetirePending}
									onClick={toggleRetired}
									type='button'
									variant='ghost'
								>
									{retireIcon}
									Retire
								</Button>
								<Button
									aria-label='Previous review card'
									disabled={stream.previousItem == null}
									onClick={() => navigateToItem(stream.previousItem)}
									type='button'
									variant='outline'
								>
									<ArrowLeft className='size-4' />
									Back
								</Button>
								<Button
									aria-label='Next review card'
									disabled={stream.nextItem == null}
									onClick={() => navigateToItem(stream.nextItem)}
									type='button'
									variant='outline'
								>
									Forward
									<ArrowRight className='size-4' />
								</Button>
							</div>
						</footer>
						<RetireReviewCardDialog
							isPending={isRetirePending}
							onConfirm={() => {
								confirmToggleRetired().catch(() => {})
							}}
							onOpenChange={setIsRetireDialogOpen}
							onSeeReviews={handleSeeReviews}
							open={isRetireDialogOpen}
						/>
					</div>
				)}
			</PageLayout.Content>
		</PageLayout>
	)
}
