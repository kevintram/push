import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ComponentProps, KeyboardEvent, MouseEvent } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { DropdownMenu } from '~/components/ui/dropdown-menu'
import { reviewCardKeys } from '~/features/review-cards/api/queryKeys'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { reviewsQueryOptions } from '~/features/reviews/api/getReviews'
import { reviewQueueKeys } from '~/features/reviews/api/queryKeys'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import type { Rating } from '~/features/reviews/types/review.types'
import {
	getLatestCompletedReview,
	splitReviews
} from '~/features/reviews/utils/reviewCollections'
import {
	getReviewCreatedToastActionLabel,
	getReviewCreatedToastDescription
} from '~/features/reviews/utils/reviewToastDescription'
import { searchKeys } from '~/features/search/api/searchAll'
import { localDateString } from '~/utils/date'
import { type ReviewRatingState, ratingOptions } from '../reviewRatingOptions'
import type { ReviewsMenuProps } from './shared'

type DropdownMenuOpenChangeHandler = NonNullable<
	ComponentProps<typeof DropdownMenu>['onOpenChange']
>
type DropdownMenuOpenChangeDetails =
	Parameters<DropdownMenuOpenChangeHandler>[1]

export function useReviewsMenu({
	align = 'end',
	buttonVariant = 'default',
	compactTriggerBadges = false,
	hasLastReviewed = false,
	onSeeAll,
	reviewCardId,
	reviews: providedReviews,
	triggerCounts
}: Pick<
	ReviewsMenuProps,
	| 'align'
	| 'buttonVariant'
	| 'compactTriggerBadges'
	| 'hasLastReviewed'
	| 'onSeeAll'
	| 'reviewCardId'
	| 'reviews'
	| 'triggerCounts'
>) {
	const queryClient = useQueryClient()
	const navigate = useNavigate()
	const [isOpen, setIsOpen] = useState(false)
	const [hasNestedOverlayOpen, setHasNestedOverlayOpen] = useState(false)
	const hasDeferredStructuralInvalidationRef = useRef(false)
	const hasModalOverlayOpenRef = useRef(false)
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
		if (hasLiveProvidedReviews) return providedReviews
		if (hasLiveQueriedReviews) return queriedReviews
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
		latestCompletedReview !== null ||
		shouldRenderSummaryLoadingState
	const uncompletedOption = useMemo(
		() => ratingOptions.find(option => option.value === 'uncompleted') ?? null,
		[]
	)
	const completedOptions = useMemo(
		() => ratingOptions.filter(option => option.value !== 'uncompleted'),
		[]
	)
	const triggerBadgeContext: 'default' | 'primary' =
		buttonVariant === 'default' ? 'primary' : 'default'
	const triggerDotSize: 'compact' | 'default' = compactTriggerBadges
		? 'compact'
		: 'default'

	const createReview = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			const review = await createReviewMutation.mutateAsync({
				review_card_id: reviewCardId,
				rating,
				description: '',
				scheduled_at: null,
				completed_at: completedAt
			})

			if (completedAt === null) {
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
		if (nestedOverlayIntentTimeoutRef.current !== null) {
			clearTimeout(nestedOverlayIntentTimeoutRef.current)
			nestedOverlayIntentTimeoutRef.current = null
		}
		nestedOverlayIntentRef.current = false
	}, [])

	const clearNestedOverlayCloseTimeout = useCallback(() => {
		if (nestedOverlayCloseTimeoutRef.current !== null) {
			clearTimeout(nestedOverlayCloseTimeoutRef.current)
			nestedOverlayCloseTimeoutRef.current = null
		}
	}, [])

	const markNestedOverlayIntent = useCallback(() => {
		nestedOverlayIntentRef.current = true
		if (nestedOverlayIntentTimeoutRef.current !== null) {
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
		hasModalOverlayOpenRef.current = false
		setIsOpen(false)
	}, [clearNestedOverlayCloseTimeout, clearNestedOverlayIntent])

	const flushDeferredStructuralInvalidation = useCallback(async () => {
		if (!hasDeferredStructuralInvalidationRef.current) return

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
		flushDeferredStructuralInvalidation().catch(() => {})
	}, [closeMenu, flushDeferredStructuralInvalidation])

	const handleReviewItemClick = useCallback(
		(reviewId: number) => {
			hasModalOverlayOpenRef.current = true
			handleNestedOverlayOpenChange(true)
			flushDeferredStructuralInvalidation().catch(() => {})
			openReviewDialog(reviewId, {
				onClose: () => {
					hasModalOverlayOpenRef.current = false
					handleNestedOverlayOpenChange(false)
				}
			})
		},
		[
			flushDeferredStructuralInvalidation,
			handleNestedOverlayOpenChange,
			openReviewDialog
		]
	)

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

	const shouldKeepMenuOpenForNestedOverlay = useCallback(
		(eventDetails?: DropdownMenuOpenChangeDetails) => {
			if (eventDetails?.reason === 'outside-press') {
				return hasModalOverlayOpenRef.current || nestedOverlayIntentRef.current
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
				flushDeferredStructuralInvalidation().catch(() => {})
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

	return {
		align,
		completedOptions,
		createReviewPending: createReviewMutation.isPending,
		dueReviews,
		dueTodayCount,
		handleMenuOpenChange,
		handleNestedOverlayOpenChange,
		handleRatingSelect,
		handleReviewItemClick,
		handleSeeAll,
		hasReviewSummarySections,
		isOpen,
		latestCompletedReview,
		markDeferredStructuralInvalidation,
		markNestedOverlayIntent,
		overdueCount,
		setIsOpen,
		shouldRenderSummaryLoadingState,
		stopMenuEventPropagation,
		triggerBadgeContext,
		triggerDotSize,
		uncompletedOption,
		uncompletedUnscheduledReviews,
		unscheduledCount
	}
}
