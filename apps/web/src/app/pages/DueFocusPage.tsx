import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Loader2, Sunset } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { DuePageLayout } from '~/app/pages/due/DuePageLayout'
import { useDueFocusStream } from '~/app/pages/due/useDueFocusStream'
import { ReviewCardDetailSurface } from '~/app/pages/review-card-detail/ReviewCardDetailSurface'
import { Button } from '~/components/ui/button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { reviewCardQueryOptions } from '~/modules/review-cards/api/getReviewCard'
import { useUpdateReviewCard } from '~/modules/review-cards/api/updateReviewCard'
import { RetireReviewCardDialog } from '~/modules/review-cards/components/RetireReviewCardDialog'
import {
	getStoredDueViewPreference,
	persistDueViewPreference,
} from '~/modules/review-cards/dueQueueViewPreferences'
import {
	buildFocusSearch,
	makeShuffleSeed,
	type ReviewFocusSearch,
} from '~/modules/review-cards/reviewFocusSearch'
import {
	type ReviewCardQueueItem,
	type ReviewFilter,
	type ReviewFocusOrder,
} from '~/modules/review-cards/types/review-card.types'
import { hasScheduledDueReviews } from '~/modules/review-cards/utils/hasScheduledDueReviews'
import { useCreateReview } from '~/modules/reviews/api/createReview'
import { reviewsQueryOptions } from '~/modules/reviews/api/getReviews'
import { type Rating } from '~/modules/reviews/types/review.types'
import { localDateString } from '~/utils/date'
import { getRatingIcon } from '~/utils/getRatingIcon'

const RATING_OPTIONS: Array<{ label: string; value: Exclude<Rating, null> }> = [
	{ label: 'Miss', value: 'miss' },
	{ label: 'Hard', value: 'hard' },
	{ label: 'Good', value: 'good' },
	{ label: 'Easy', value: 'easy' },
]

export function DueFocusPage({
	done,
	filter,
	includeFuture = false,
	order,
	reviewCardId,
	shuffle,
}: {
	done?: boolean
	filter: ReviewFilter
	includeFuture?: boolean
	order: ReviewFocusOrder
	reviewCardId?: number
	shuffle?: string
}) {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const stream = useDueFocusStream({
		activeReviewCardId: reviewCardId,
		filter,
		includeFuture,
		order,
		shuffle,
	})
	const createReviewMutation = useCreateReview()
	const updateReviewCardMutation = useUpdateReviewCard()
	const [isRetireDialogOpen, setIsRetireDialogOpen] = useState(false)
	const activeCard = stream.activeItem?.card ?? null
	const activeReviewCardId = activeCard?.id ?? reviewCardId
	const currentFocusSearch = buildFocusSearch({
		card: reviewCardId,
		done,
		filter,
		include_future: includeFuture,
		order,
		shuffle,
	})

	function navigateToFocus(
		search: ReviewFocusSearch,
		options?: { replace?: boolean },
	) {
		navigate({
			to: '/due/focus',
			search,
			replace: options?.replace,
		})
	}

	function navigateToFocusRoot(search?: ReviewFocusSearch) {
		navigate({
			to: '/due/focus',
			search:
				search ??
				buildFocusSearch({
					done,
					filter,
					include_future: includeFuture,
					order,
					shuffle,
				}),
		})
	}

	function navigateToDone() {
		navigateToFocusRoot(
			buildFocusSearch({
				done: true,
				filter,
				include_future: includeFuture,
				order,
				shuffle,
			}),
		)
	}

	useEffect(() => {
		persistDueViewPreference({
			...getStoredDueViewPreference(),
			focusOrder: order,
		})
	}, [order])

	useEffect(() => {
		if (order !== 'random' || shuffle != null) return
		navigateToFocus(
			buildFocusSearch({
				done,
				filter,
				include_future: includeFuture,
				order,
				shuffle: makeShuffleSeed(),
			}),
			{ replace: true },
		)
		// oxlint-disable-next-line react-hooks/exhaustive-deps -- navigateToFocus closes over navigate.
	}, [done, filter, includeFuture, order, shuffle])

	useEffect(() => {
		if (stream.isLoading || done) return
		if (order === 'random' && shuffle == null) return
		const firstItem = stream.firstStreamItem
		if (reviewCardId == null) {
			if (!firstItem) return
			navigateToFocus(
				buildFocusSearch({
					card: firstItem.card.id,
					filter,
					include_future: includeFuture,
					order,
					shuffle,
				}),
			)
			return
		}

		if (stream.activeItem != null) return
		navigateToFocus(
			buildFocusSearch({
				card: firstItem?.card.id,
				filter,
				include_future: includeFuture,
				order,
				shuffle,
			}),
			{ replace: true },
		)
	}, [
		done,
		filter,
		includeFuture,
		order,
		reviewCardId,
		shuffle,
		stream.activeItem,
		stream.firstStreamItem,
		stream.isLoading,
	])

	useEffect(() => {
		setIsRetireDialogOpen(false)
	}, [activeReviewCardId])

	useEffect(() => {
		for (const item of [stream.previousItem, stream.nextItem]) {
			const cardId = item?.card.id
			if (cardId == null) continue
			queryClient
				.prefetchQuery(reviewCardQueryOptions(cardId))
				.catch(() => {})
			queryClient
				.prefetchQuery(reviewsQueryOptions({ reviewCardId: cardId }))
				.catch(() => {})
		}
	}, [queryClient, stream.nextItem, stream.previousItem])

	function navigateToItem(item: ReviewCardQueueItem | null) {
		if (!item) return
		navigateToFocus(
			buildFocusSearch({
				card: item.card.id,
				filter,
				include_future: includeFuture,
				order,
				shuffle,
			}),
		)
	}

	function advanceAfterCompletedItem() {
		if (stream.nextItem) {
			navigateToItem(stream.nextItem)
		} else {
			navigateToDone()
		}
	}

	async function rateCard(rating: Exclude<Rating, null>) {
		if (!activeCard || createReviewMutation.isPending) return

		try {
			await createReviewMutation.mutateAsync({
				reviewCardId: activeCard.id,
				rating,
				completedAt: localDateString(),
			})
			advanceAfterCompletedItem()
		} catch {
			toast.error('Failed to record review')
		}
	}

	async function confirmToggleRetired() {
		if (!activeCard) return
		try {
			await updateReviewCardMutation.mutateAsync({
				id: activeCard.id,
				retired: !activeCard.retired,
			})
			setIsRetireDialogOpen(false)
			advanceAfterCompletedItem()
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
			search: { tab: 'reviews' },
		})
	}

	function handleOrderChange(nextOrder: ReviewFocusOrder) {
		navigateToFocusRoot(
			buildFocusSearch({
				filter,
				include_future: includeFuture,
				order: nextOrder,
				shuffle:
					nextOrder === 'random'
						? (shuffle ?? makeShuffleSeed())
						: undefined,
			}),
		)
	}

	function handleShuffle() {
		navigateToFocusRoot(
			buildFocusSearch({
				filter,
				include_future: includeFuture,
				order: 'random',
				shuffle: makeShuffleSeed(),
			}),
		)
	}

	function handleContinueReviewing() {
		const firstFutureItem = stream.firstFutureItem
		if (!firstFutureItem) return
		navigateToFocus(
			buildFocusSearch({
				card: firstFutureItem.card.id,
				filter,
				include_future: true,
				order,
				shuffle,
			}),
		)
	}

	function handleSeeUpcoming() {
		navigate({
			to: '/due',
			search: { filter },
		})
	}

	const isRetirePending = updateReviewCardMutation.isPending
	const retireIcon = isRetirePending ? (
		<Loader2 className='animate-spin' />
	) : (
		<Sunset />
	)

	return (
		<DuePageLayout
			contentClassName='flex min-h-[calc(100vh-8.5rem)] max-w-screen flex-col px-2.5 py-2.5 pb-3'
			filter={filter}
			focusSearch={currentFocusSearch}
			isFocusActive={true}
			onFilterChange={nextFilter => {
				navigate({
					to: '/due/focus',
					search: buildFocusSearch({
						filter: nextFilter,
						include_future: includeFuture,
						order,
						shuffle,
					}),
				})
			}}
			onOrderChange={handleOrderChange}
			onShuffle={handleShuffle}
			order={order}
		>
			{stream.isLoading ? (
				<LoadingSpinner containerClassName='min-h-64' />
			) : done ? (
				<Empty className='min-h-[calc(100vh-14rem)]'>
					<EmptyHeader>
						<EmptyTitle>Review complete</EmptyTitle>
						<EmptyDescription>
							You finished the current focus queue.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<div className='flex flex-wrap justify-center gap-2'>
							<Button
								disabled={stream.firstFutureItem == null}
								onClick={handleContinueReviewing}
								type='button'
							>
								Review more
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
			) : activeCard == null ? (
				<Empty className='min-h-[calc(100vh-14rem)]'>
					<EmptyHeader>
						<EmptyTitle>You're all caught up!</EmptyTitle>
						<EmptyDescription>
							There are no current items in this focus queue.
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
				<div className='mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3'>
					<div className='min-h-0 flex-1'>
						<ReviewCardDetailSurface
							mode='contained'
							onCompletedReviewCreated={advanceAfterCompletedItem}
							reviewCardId={activeCard.id}
						/>
					</div>
					<footer className='flex shrink-0 flex-col gap-3 border-t bg-background/80 pt-3 sm:flex-row sm:items-center sm:justify-between'>
						<div className='flex flex-wrap items-center gap-2'>
							{RATING_OPTIONS.map(option => (
								<Button
									disabled={
										createReviewMutation.isPending ||
										activeCard == null
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
								onClick={() =>
									navigateToItem(stream.previousItem)
								}
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
		</DuePageLayout>
	)
}
