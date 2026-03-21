import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
import type {
	ComponentProps,
	KeyboardEvent,
	MouseEvent,
	MouseEventHandler
} from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { ReviewStatusDots } from '~/components/ui/review-status-dots'
import { reviewCardKeys } from '~/features/review-cards/api/queryKeys'
import { searchKeys } from '~/features/search/api/searchAll'
import { localDateString } from '~/utils/date'
import { useCreateReview } from '../api/createReview'
import { reviewsQueryOptions } from '../api/getReviews'
import { reviewQueueKeys } from '../api/queryKeys'
import { useReviewDialog } from '../hooks/useReviewDialog'
import type { Rating, ReviewListItem } from '../types/review.types'
import {
	getLatestCompletedReview,
	splitReviews
} from '../utils/reviewCollections'
import {
	getReviewCreatedToastActionLabel,
	getReviewCreatedToastDescription
} from '../utils/reviewToastDescription'
import { ReviewItem } from './ReviewItem'
import {
	getOptionIcon,
	type ReviewRatingState,
	ratingOptions
} from './reviewRatingOptions'

type ReviewsMenuProps = {
	reviewCardId: number
	align?: 'start' | 'center' | 'end'
	buttonClassName?: string
	buttonSize?: NonNullable<ComponentProps<typeof Button>['size']>
	buttonVariant?: NonNullable<ComponentProps<typeof Button>['variant']>
	disabled?: boolean
	onSeeAll?: () => void
	onTriggerClick?: MouseEventHandler<HTMLButtonElement>
	onTriggerFocus?: ComponentProps<typeof Button>['onFocus']
	onTriggerKeyDown?: ComponentProps<typeof Button>['onKeyDown']
	onTriggerMouseEnter?: MouseEventHandler<HTMLButtonElement>
	reviews?: Array<ReviewListItem>
	compactTriggerBadges?: boolean
	hasLastReviewed?: boolean
	triggerCounts?: {
		unscheduledCount: number
		overdueCount: number
		dueTodayCount: number
	}
}

export function ReviewsMenu({
	reviewCardId,
	align = 'end',
	buttonClassName,
	buttonSize = 'sm',
	buttonVariant = 'default',
	disabled = false,
	onSeeAll,
	onTriggerClick,
	onTriggerFocus,
	onTriggerKeyDown,
	onTriggerMouseEnter,
	reviews: providedReviews,
	compactTriggerBadges = false,
	hasLastReviewed = false,
	triggerCounts
}: ReviewsMenuProps) {
	const queryClient = useQueryClient()
	const navigate = useNavigate()
	const [isOpen, setIsOpen] = useState(false)
	const [hasNestedOverlayOpen, setHasNestedOverlayOpen] = useState(false)
	const hasDeferredStructuralInvalidationRef = useRef(false)
	const nestedOverlayIntentRef = useRef(false)
	const nestedOverlayCloseTimeoutRef = useRef<ReturnType<
		typeof setTimeout
	> | null>(null)
	const nestedOverlayIntentTimeoutRef = useRef<ReturnType<
		typeof setTimeout
	> | null>(null)
	const {
		data: queriedReviews,
		isFetching: isReviewsFetching,
		isLoading: isReviewsLoading
	} = useQuery({
		...reviewsQueryOptions({ reviewCardId }),
		enabled: providedReviews === undefined && isOpen
	})
	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()
	const hasLiveProvidedReviews = providedReviews !== undefined
	const hasLiveQueriedReviews =
		isOpen &&
		providedReviews === undefined &&
		queriedReviews !== undefined &&
		!isReviewsFetching
	const hasLiveReviews = hasLiveProvidedReviews || hasLiveQueriedReviews
	const reviews = useMemo(() => {
		if (hasLiveProvidedReviews) {
			return providedReviews
		}
		if (hasLiveQueriedReviews) {
			return queriedReviews
		}
		return []
	}, [
		hasLiveProvidedReviews,
		hasLiveQueriedReviews,
		providedReviews,
		queriedReviews
	])

	const { uncompletedUnscheduledReviews, overdueReviews, todayReviews } =
		useMemo(() => splitReviews(reviews), [reviews])
	const dueReviews = useMemo(
		() => [...overdueReviews, ...todayReviews],
		[overdueReviews, todayReviews]
	)
	const latestCompletedReview = useMemo(
		() => getLatestCompletedReview(reviews),
		[reviews]
	)
	const overdueCount = hasLiveReviews
		? overdueReviews.length
		: (triggerCounts?.overdueCount ?? overdueReviews.length)
	const dueTodayCount = hasLiveReviews
		? todayReviews.length
		: (triggerCounts?.dueTodayCount ?? todayReviews.length)
	const unscheduledCount = hasLiveReviews
		? uncompletedUnscheduledReviews.length
		: (triggerCounts?.unscheduledCount ?? uncompletedUnscheduledReviews.length)
	const expectedDueCount = overdueCount + dueTodayCount
	const hasExpectedSummaryContent =
		expectedDueCount > 0 || unscheduledCount > 0 || hasLastReviewed
	const isSummaryLoading =
		providedReviews === undefined &&
		isOpen &&
		!hasLiveQueriedReviews &&
		(isReviewsLoading || isReviewsFetching)
	const shouldRenderSummaryLoadingState =
		isSummaryLoading && hasExpectedSummaryContent
	const hasReviewSummarySections =
		dueReviews.length > 0 ||
		uncompletedUnscheduledReviews.length > 0 ||
		latestCompletedReview != null ||
		shouldRenderSummaryLoadingState
	const uncompletedOption = useMemo(
		() => ratingOptions.find(option => option.value === 'uncompleted') ?? null,
		[]
	)
	const completedOptions = useMemo(
		() => ratingOptions.filter(option => option.value !== 'uncompleted'),
		[]
	)
	const triggerBadgeContext =
		buttonVariant === 'default' ? 'primary' : 'default'
	const triggerDotSize = compactTriggerBadges ? 'compact' : 'default'

	const createReview = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			const review = await createReviewMutation.mutateAsync({
				review_card_id: reviewCardId,
				rating,
				description: '',
				scheduled_at: null,
				completed_at: completedAt
			})

			if (completedAt == null) {
				openReviewDialog(review.id)
				return
			}

			toast('Review created', {
				description: getReviewCreatedToastDescription(review),
				action: {
					label: getReviewCreatedToastActionLabel(review),
					onClick: () => openReviewDialog(review.id)
				}
			})
		},
		[createReviewMutation, openReviewDialog, reviewCardId]
	)

	const clearNestedOverlayIntent = useCallback(() => {
		if (nestedOverlayIntentTimeoutRef.current != null) {
			clearTimeout(nestedOverlayIntentTimeoutRef.current)
			nestedOverlayIntentTimeoutRef.current = null
		}
		nestedOverlayIntentRef.current = false
	}, [])

	const clearNestedOverlayCloseTimeout = useCallback(() => {
		if (nestedOverlayCloseTimeoutRef.current != null) {
			clearTimeout(nestedOverlayCloseTimeoutRef.current)
			nestedOverlayCloseTimeoutRef.current = null
		}
	}, [])

	const markNestedOverlayIntent = useCallback(() => {
		nestedOverlayIntentRef.current = true
		if (nestedOverlayIntentTimeoutRef.current != null) {
			clearTimeout(nestedOverlayIntentTimeoutRef.current)
		}
		nestedOverlayIntentTimeoutRef.current = setTimeout(() => {
			nestedOverlayIntentRef.current = false
			nestedOverlayIntentTimeoutRef.current = null
		}, 0)
	}, [])

	const handleNestedOverlayOpenChange = useCallback(
		(open: boolean) => {
			if (open) {
				clearNestedOverlayCloseTimeout()
				clearNestedOverlayIntent()
				setHasNestedOverlayOpen(true)
				return
			}

			clearNestedOverlayCloseTimeout()
			nestedOverlayCloseTimeoutRef.current = setTimeout(() => {
				setHasNestedOverlayOpen(false)
				nestedOverlayCloseTimeoutRef.current = null
			}, 0)
		},
		[clearNestedOverlayCloseTimeout, clearNestedOverlayIntent]
	)

	const closeMenu = useCallback(() => {
		clearNestedOverlayCloseTimeout()
		clearNestedOverlayIntent()
		setHasNestedOverlayOpen(false)
		setIsOpen(false)
	}, [clearNestedOverlayCloseTimeout, clearNestedOverlayIntent])

	const flushDeferredStructuralInvalidation = useCallback(async () => {
		if (!hasDeferredStructuralInvalidationRef.current) {
			return
		}

		hasDeferredStructuralInvalidationRef.current = false
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: reviewCardKeys.all }),
			queryClient.invalidateQueries({ queryKey: reviewQueueKeys.all }),
			queryClient.invalidateQueries({ queryKey: searchKeys.all })
		])
	}, [queryClient])

	const markDeferredStructuralInvalidation = useCallback(() => {
		hasDeferredStructuralInvalidationRef.current = true
	}, [])

	const closeMenuAndFlushDeferredStructuralInvalidation = useCallback(() => {
		closeMenu()
		void flushDeferredStructuralInvalidation()
	}, [closeMenu, flushDeferredStructuralInvalidation])

	const handleRatingSelect = useCallback(
		async (ratingState: ReviewRatingState) => {
			if (createReviewMutation.isPending) return

			try {
				closeMenuAndFlushDeferredStructuralInvalidation()
				if (ratingState === 'uncompleted') {
					await createReview(null, null)
				} else {
					await createReview(localDateString(), ratingState)
				}
			} catch {
				toast.error('Failed to create review')
			}
		},
		[
			closeMenuAndFlushDeferredStructuralInvalidation,
			createReview,
			createReviewMutation.isPending
		]
	)

	const handleSeeAll = useCallback(() => {
		closeMenuAndFlushDeferredStructuralInvalidation()
		if (onSeeAll) {
			onSeeAll()
			return
		}

		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: reviewCardId.toString() },
			search: { tab: 'reviews' }
		})
	}, [
		closeMenuAndFlushDeferredStructuralInvalidation,
		navigate,
		onSeeAll,
		reviewCardId
	])

	type DropdownMenuOpenChangeHandler = NonNullable<
		ComponentProps<typeof DropdownMenu>['onOpenChange']
	>
	type DropdownMenuOpenChangeDetails =
		Parameters<DropdownMenuOpenChangeHandler>[1]

	const shouldKeepMenuOpenForNestedOverlay = useCallback(
		(eventDetails?: DropdownMenuOpenChangeDetails) => {
			if (eventDetails?.reason === 'outside-press') {
				return nestedOverlayIntentRef.current
			}

			return (
				(hasNestedOverlayOpen || nestedOverlayIntentRef.current) &&
				(eventDetails?.reason === 'focus-out' ||
					eventDetails?.reason === 'sibling-open')
			)
		},
		[hasNestedOverlayOpen]
	)

	const handleMenuOpenChange = useCallback(
		(nextOpen: boolean, eventDetails?: DropdownMenuOpenChangeDetails) => {
			if (!nextOpen && shouldKeepMenuOpenForNestedOverlay(eventDetails)) {
				return
			}

			clearNestedOverlayIntent()
			if (!nextOpen) {
				clearNestedOverlayCloseTimeout()
				setHasNestedOverlayOpen(false)
				void flushDeferredStructuralInvalidation()
			}
			setIsOpen(nextOpen)
		},
		[
			clearNestedOverlayCloseTimeout,
			clearNestedOverlayIntent,
			flushDeferredStructuralInvalidation,
			shouldKeepMenuOpenForNestedOverlay
		]
	)

	const stopMenuEventPropagation = useCallback(
		(event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
			event.stopPropagation()
		},
		[]
	)

	return (
		<DropdownMenu onOpenChange={handleMenuOpenChange} open={isOpen}>
			<DropdownMenuTrigger
				disabled={disabled || createReviewMutation.isPending}
				render={
					<Button
						className={buttonClassName}
						onClick={onTriggerClick}
						onFocus={onTriggerFocus}
						onKeyDown={onTriggerKeyDown}
						onMouseEnter={onTriggerMouseEnter}
						size={buttonSize}
						variant={buttonVariant}
					>
						{createReviewMutation.isPending ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : null}
						<span>Reviews</span>
						<ReviewStatusDots
							className='pointer-events-none'
							dueTodayCount={dueTodayCount}
							overdueCount={overdueCount}
							size={triggerDotSize}
							surface={triggerBadgeContext}
							testIdPrefix='reviews-trigger'
							unscheduledCount={unscheduledCount}
						/>
						<ChevronDown className='h-4 w-4' />
					</Button>
				}
			/>
			<DropdownMenuContent
				align={align}
				className={
					hasReviewSummarySections
						? 'w-[18rem] max-w-[calc(100vw-2rem)]'
						: 'max-w-[calc(100vw-2rem)]'
				}
				matchTriggerWidth={false}
				onClick={stopMenuEventPropagation}
				onKeyDown={stopMenuEventPropagation}
			>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger disabled={createReviewMutation.isPending}>
						<Plus className='h-4 w-4' />
						Create new
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						{uncompletedOption ? (
							<DropdownMenuItem
								disabled={createReviewMutation.isPending}
								onClick={() => handleRatingSelect(uncompletedOption.value)}
							>
								<div className='grid w-full grid-cols-[auto_1fr] items-center gap-x-2'>
									{getOptionIcon(uncompletedOption.value)}
									<span>{uncompletedOption.label}</span>
									<span className='col-start-2 text-muted-foreground/70 text-xs'>
										For later
									</span>
								</div>
							</DropdownMenuItem>
						) : null}
						<DropdownMenuSeparator />
						{completedOptions.map(option => (
							<DropdownMenuItem
								disabled={createReviewMutation.isPending}
								key={option.value}
								onClick={() => handleRatingSelect(option.value)}
							>
								<div className='grid w-full grid-cols-[auto_1fr] items-center gap-x-2'>
									{getOptionIcon(option.value)}
									<span>{option.label}</span>
								</div>
							</DropdownMenuItem>
						))}
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				{shouldRenderSummaryLoadingState ? (
					<>
						<DropdownMenuSeparator />
						<LoadingSpinner containerClassName='min-h-12 py-3' size='sm' />
					</>
				) : dueReviews.length > 0 ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuLabel>Due</DropdownMenuLabel>
							{dueReviews.map(review => (
								<div className='px-1' key={review.id}>
									<ReviewItem
										deferStructuralInvalidation={true}
										entry={review}
										onDeferredInvalidation={markDeferredStructuralInvalidation}
										onNestedOverlayOpenChange={handleNestedOverlayOpenChange}
										onNestedOverlayTriggerInteract={markNestedOverlayIntent}
										onReviewClick={reviewId => {
											handleNestedOverlayOpenChange(true)
											void flushDeferredStructuralInvalidation()
											openReviewDialog(reviewId, {
												onClose: () =>
													handleNestedOverlayOpenChange(false)
											})
										}}
										showCardColumn={false}
										variant='default'
									/>
								</div>
							))}
						</DropdownMenuGroup>
					</>
				) : null}

				{uncompletedUnscheduledReviews.length > 0 ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuLabel>Unscheduled</DropdownMenuLabel>
							{uncompletedUnscheduledReviews.map(review => (
								<div className='px-1' key={review.id}>
									<ReviewItem
										deferStructuralInvalidation={true}
										entry={review}
										onDeferredInvalidation={markDeferredStructuralInvalidation}
										onNestedOverlayOpenChange={handleNestedOverlayOpenChange}
										onNestedOverlayTriggerInteract={markNestedOverlayIntent}
										onReviewClick={reviewId => {
											handleNestedOverlayOpenChange(true)
											void flushDeferredStructuralInvalidation()
											openReviewDialog(reviewId, {
												onClose: () =>
													handleNestedOverlayOpenChange(false)
											})
										}}
										showCardColumn={false}
										variant='default'
									/>
								</div>
							))}
						</DropdownMenuGroup>
					</>
				) : null}

				{latestCompletedReview ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuLabel>Last reviewed</DropdownMenuLabel>
							<div className='px-1'>
								<ReviewItem
									deferStructuralInvalidation={true}
									entry={latestCompletedReview}
									onDeferredInvalidation={markDeferredStructuralInvalidation}
									onNestedOverlayOpenChange={handleNestedOverlayOpenChange}
									onNestedOverlayTriggerInteract={markNestedOverlayIntent}
									onReviewClick={reviewId => {
										handleNestedOverlayOpenChange(true)
										void flushDeferredStructuralInvalidation()
										openReviewDialog(reviewId, {
											onClose: () =>
												handleNestedOverlayOpenChange(false)
										})
									}}
									showCardColumn={false}
									variant='default'
								/>
							</div>
						</DropdownMenuGroup>
					</>
				) : null}

				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleSeeAll}>
					<span className='font-medium'>See all</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
