import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { type KeyboardEvent, type MouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Card } from '~/components/ui/card'
import { type StatusBadgeItem } from '~/components/ui/status-badge'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { useRevealPanel } from '~/hooks/useRevealPanel'
import { cn } from '~/lib/utils'
import { useReviewMode } from '~/stores/ReviewModeContext'
import { estimateExpandedCardSize } from '~/utils/estimateCardSize'
import {
	formatAbsoluteDate,
	formatRelativeDate,
} from '~/utils/formatRelativeDate'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'

import {
	REVIEW_LIST_QUERY_STALE_TIME,
	reviewsQueryOptions,
} from '../../reviews/api/getReviews'
import { useReviewDialog } from '../../reviews/hooks/useReviewDialog'
import { getReviewCard } from '../api/getReviewCard'
import { reviewCardKeys } from '../api/queryKeys'
import { useUpdateReviewCard } from '../api/updateReviewCard'
import { useDeleteReviewCardWithUndo } from '../hooks/useDeleteReviewCardWithUndo'
import { type ReviewCard as ReviewCardModel } from '../types/review-card.types'
import { hasScheduledDueReviews } from '../utils/hasScheduledDueReviews'
import { orderReviewCardStatusBadges } from '../utils/orderReviewCardStatusBadges'
import { getReviewCardDisplayTitle } from '../utils/reviewCardCopy'
import { RetireReviewCardDialog } from './RetireReviewCardDialog'
import { ReviewCardBody } from './ReviewCardBody'
import { ReviewCardFooterActions } from './ReviewCardFooterActions'
import { ReviewCardHeader } from './ReviewCardHeader'
import { ReviewCardMetaRow } from './ReviewCardMetaRow'
import { toFreshnessTier, toReviewCardStatusBadge } from './reviewCardShared'
import { ReviewCardStatusRow } from './ReviewCardStatusRow'

const MIN_HEIGHT = 96
const LARGE_CARD_CONTENT_HEIGHT_MIN = 500
const CARD_ESTIMATE_FALLBACK_WIDTH = 280
const CARD_WIDTH_REVIEWED_META_MIN = 0
const CARD_WIDTH_RATING_META_MIN = 0
const CARD_WIDTH_STABILITY_META_MIN = 300

interface ReviewCardProps {
	reviewCard: ReviewCardModel
	onClick?: () => void
	minHeight?: number
	enableLargeCardMode?: boolean
	searchQuery?: string
	statusBadges?: Array<StatusBadgeItem>
	onRemoveFromTab?: () => void
	removeFromTabLabel?: string
	isRemovingFromTab?: boolean
	parentLabel?: string
	typeLabelOverride?: string
}

export function ReviewCard({
	reviewCard,
	onClick,
	minHeight = MIN_HEIGHT,
	enableLargeCardMode = false,
	searchQuery,
	statusBadges,
	onRemoveFromTab,
	removeFromTabLabel = 'Remove from tab',
	isRemovingFromTab = false,
	parentLabel,
	typeLabelOverride,
}: ReviewCardProps) {
	const [cardRef, cardRect] = useResizeObserver<HTMLDivElement>()
	const queryClient = useQueryClient()
	const { mutate: updateReviewCard, isPending: isUpdatingReviewCard } =
		useUpdateReviewCard()
	const { deleteWithUndo } = useDeleteReviewCardWithUndo()

	const metrics = useLearnableMetrics({
		retrievability: reviewCard.retrievability,
		freshnessTier: toFreshnessTier(reviewCard.freshnessTier),
		daysUntilNextTier: reviewCard.daysUntilNextTier,
		stability: reviewCard.stability,
		lastReviewedAt: reviewCard.lastReviewedAt,
		inheritedStability: null,
	})

	const {
		freshnessTierInfo,
		freshnessTierColor,
		isUnreviewed,
		stabilityText,
	} = metrics

	const { hidesPrimary, hidesSecondary } = useReviewMode()
	const effectiveHidesSecondary =
		hidesSecondary && reviewCard.type !== 'practice'
	const hideParent = hidesPrimary && reviewCard.topicId != null
	const [isPrimaryRevealed, setIsPrimaryRevealed] = useState(!hidesPrimary)
	const [isSecondaryRevealed, setIsSecondaryRevealed] = useState(
		!effectiveHidesSecondary,
	)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [isRetireDialogOpen, setIsRetireDialogOpen] = useState(false)
	const navigate = useNavigate()

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(reviewCard.lastReviewedAt, {
				includeFuture: false,
				nullLabel: 'never',
			}),
		[reviewCard.lastReviewedAt],
	)
	const lastReviewedDate = useMemo(
		() => formatAbsoluteDate(reviewCard.lastReviewedAt),
		[reviewCard.lastReviewedAt],
	)

	const highlightedPrimary = useMemo(() => {
		if (!reviewCard.primaryText) return null
		if (!searchQuery?.trim()) return reviewCard.primaryText
		return highlightText({
			text: reviewCard.primaryText,
			query: searchQuery,
		})
	}, [reviewCard.primaryText, searchQuery])

	const highlightedSecondary = useMemo(() => {
		if (!reviewCard.secondaryText) return null
		if (!searchQuery?.trim()) return reviewCard.secondaryText
		return truncateWithHighlight(reviewCard.secondaryText, searchQuery, 200)
	}, [reviewCard.secondaryText, searchQuery])

	const hasPrimaryText = Boolean(reviewCard.primaryText.trim())
	const hasSecondaryText = Boolean(reviewCard.secondaryText.trim())
	const hidePrimary = hidesPrimary && hasPrimaryText && !isPrimaryRevealed
	const hideSecondary =
		effectiveHidesSecondary && hasSecondaryText && !isSecondaryRevealed
	const displayPrimaryText = getReviewCardDisplayTitle(reviewCard)
	const estimatedExpandedCardHeight = useMemo(() => {
		const estimatedWidth =
			cardRect.width > 0 ? cardRect.width : CARD_ESTIMATE_FALLBACK_WIDTH
		return estimateExpandedCardSize(
			displayPrimaryText,
			reviewCard.secondaryText || '',
			estimatedWidth,
		)
	}, [cardRect.width, displayPrimaryText, reviewCard.secondaryText])
	const isLargeCard =
		enableLargeCardMode &&
		estimatedExpandedCardHeight >= LARGE_CARD_CONTENT_HEIGHT_MIN
	const canUseGuessPanel =
		enableLargeCardMode && effectiveHidesSecondary && hasSecondaryText
	const largeCardHeight = Math.max(minHeight, estimatedExpandedCardHeight)
	const {
		revealPanelTab,
		setRevealPanelTab,
		guessText: guessSecondaryText,
		setGuessText: setGuessSecondaryText,
		isCopied: isRevealPanelCopied,
		handleCopyGuessText,
		handleCopyRevealText,
	} = useRevealPanel({
		revealText: reviewCard.secondaryText,
		entityId: reviewCard.id < 0 ? null : reviewCard.id,
		hidesSecondary: effectiveHidesSecondary,
	})

	useEffect(() => {
		setIsPrimaryRevealed(!hidesPrimary)
		setIsSecondaryRevealed(!effectiveHidesSecondary)
	}, [hidesPrimary, effectiveHidesSecondary])
	useEffect(() => {
		if (reviewCard.id < 0) return
		setIsRetireDialogOpen(false)
	}, [reviewCard.id])

	const handleActivate = useCallback(() => {
		onClick?.()
	}, [onClick])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onClick?.()
			}
		},
		[onClick],
	)

	const handleMouseEnter = useCallback(() => {
		queryClient.prefetchQuery({
			queryKey: reviewCardKeys.detail(reviewCard.id),
			queryFn: () => getReviewCard(reviewCard.id),
			staleTime: 30_000,
		})
	}, [queryClient, reviewCard.id])

	const handleReviewsMenuPrefetch = useCallback(() => {
		const queryOptions = reviewsQueryOptions({
			reviewCardId: reviewCard.id,
		})
		const queryState = queryClient.getQueryState(queryOptions.queryKey)

		if (queryState?.fetchStatus === 'fetching') {
			return
		}

		if (
			queryState?.dataUpdatedAt != null &&
			Date.now() - queryState.dataUpdatedAt < REVIEW_LIST_QUERY_STALE_TIME
		) {
			return
		}

		queryClient.prefetchQuery(queryOptions)
	}, [queryClient, reviewCard.id])

	const confirmRetiredToggle = useCallback(() => {
		updateReviewCard({
			id: reviewCard.id,
			retired: !reviewCard.retired,
		})
		setIsRetireDialogOpen(false)
	}, [reviewCard.id, reviewCard.retired, updateReviewCard])

	const handleRetiredToggle = useCallback(
		(event: MouseEvent) => {
			event.stopPropagation()
			if (!reviewCard.retired && hasScheduledDueReviews(reviewCard)) {
				setIsRetireDialogOpen(true)
				return
			}
			confirmRetiredToggle()
		},
		[confirmRetiredToggle, reviewCard],
	)
	const handleFlaggedToggle = useCallback(
		(event: MouseEvent) => {
			event.stopPropagation()
			updateReviewCard({
				id: reviewCard.id,
				flagged: reviewCard.flaggedAt == null,
			})
		},
		[reviewCard.id, reviewCard.flaggedAt, updateReviewCard],
	)

	const handleSeeReviews = useCallback(() => {
		setIsRetireDialogOpen(false)
		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: reviewCard.id.toString() },
			search: { tab: 'reviews' },
		})
	}, [navigate, reviewCard.id])

	const handleDeleteReviewCard = useCallback(() => {
		setIsDeleteDialogOpen(false)
		deleteWithUndo(reviewCard.id)
	}, [deleteWithUndo, reviewCard.id])

	const handleRevealPrimary = useCallback((event: MouseEvent) => {
		event.stopPropagation()
		setIsPrimaryRevealed(true)
	}, [])
	const handleRevealSecondary = useCallback((event: MouseEvent) => {
		event.stopPropagation()
		setIsSecondaryRevealed(true)
	}, [])

	const { openReviewDialog } = useReviewDialog()
	const reviewCardStatusBadges = useMemo(
		() =>
			orderReviewCardStatusBadges(reviewCard.statusBadges).map(apiBadge =>
				toReviewCardStatusBadge(apiBadge, {
					onOpenReviewDialog: openReviewDialog,
				}),
			),
		[reviewCard.statusBadges, openReviewDialog],
	)
	const resolvedStatusBadges = statusBadges ?? reviewCardStatusBadges

	const typeBadgeLabel =
		typeLabelOverride ??
		(reviewCard.type === 'practice' ? 'Practice' : 'Flashcard')
	const isFlagged = reviewCard.flaggedAt != null
	const topicTitle = reviewCard.topicTitle?.trim() ?? ''
	const resolvedParentLabel =
		parentLabel ??
		(topicTitle.length > 0 ? topicTitle : `Topic #${reviewCard.topicId}`)
	const hasMeasuredCardWidth = cardRect.width > 0
	const showReviewedMeta =
		!hasMeasuredCardWidth || cardRect.width >= CARD_WIDTH_REVIEWED_META_MIN
	const showRatingMeta =
		showReviewedMeta &&
		reviewCard.lastReviewRating != null &&
		(!hasMeasuredCardWidth || cardRect.width >= CARD_WIDTH_RATING_META_MIN)
	const showStabilityMeta =
		!hasMeasuredCardWidth || cardRect.width >= CARD_WIDTH_STABILITY_META_MIN

	return (
		<Card
			className={cn(
				'relative gap-0 overflow-visible p-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
				isLargeCard ? 'max-h-none' : 'max-h-96',
				onClick ? 'cursor-pointer hover:bg-muted/50' : null,
			)}
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			onMouseEnter={handleMouseEnter}
			ref={cardRef}
			role={onClick ? 'button' : undefined}
			style={
				isLargeCard
					? {
							height: `${largeCardHeight}px`,
							minHeight: `${largeCardHeight}px`,
						}
					: { minHeight: `${minHeight}px` }
			}
			tabIndex={onClick ? 0 : undefined}
		>
			<ReviewCardStatusRow badges={resolvedStatusBadges} />
			<ReviewCardHeader
				hideParent={hideParent}
				resolvedParentLabel={resolvedParentLabel}
				typeBadgeLabel={typeBadgeLabel}
			/>
			<ReviewCardBody
				canUseGuessPanel={canUseGuessPanel}
				guessSecondaryText={guessSecondaryText}
				handleCopyGuessText={handleCopyGuessText}
				handleCopyRevealText={handleCopyRevealText}
				handleRevealPrimary={handleRevealPrimary}
				handleRevealSecondary={handleRevealSecondary}
				hidePrimary={hidePrimary}
				hideSecondary={hideSecondary}
				highlightedPrimary={highlightedPrimary}
				highlightedSecondary={highlightedSecondary}
				isLargeCard={isLargeCard}
				isRevealPanelCopied={isRevealPanelCopied}
				revealPanelTab={revealPanelTab}
				reviewCardAnswer={reviewCard.secondaryText}
				setGuessSecondaryText={setGuessSecondaryText}
				setRevealPanelTab={setRevealPanelTab}
			/>
			<ReviewCardMetaRow
				freshnessTierColor={freshnessTierColor}
				freshnessTierInfo={freshnessTierInfo}
				isUnreviewed={isUnreviewed}
				lastReviewedDate={lastReviewedDate}
				lastReviewedText={lastReviewed.text}
				lastReviewRating={reviewCard.lastReviewRating}
				showRatingMeta={showRatingMeta}
				showReviewedMeta={showReviewedMeta}
				showStabilityMeta={showStabilityMeta}
				stabilityText={stabilityText}
			/>
			<ReviewCardFooterActions
				isFlagged={isFlagged}
				isRemovingFromTab={isRemovingFromTab}
				isUpdatingReviewCard={isUpdatingReviewCard}
				onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
				onRemoveFromTab={onRemoveFromTab}
				onSeeReviews={handleSeeReviews}
				onToggleFlag={handleFlaggedToggle}
				onToggleRetired={handleRetiredToggle}
				onTriggerReviewsPrefetch={handleReviewsMenuPrefetch}
				removeFromTabLabel={removeFromTabLabel}
				reviewCard={reviewCard}
			/>
			<AlertDialog
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
			>
				<AlertDialogContent
					onClick={event => event.stopPropagation()}
					size='sm'
				>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<AlertTriangle className='h-5 w-5' />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete review card?</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete this review card and all linked
							reviews.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel buttonClassName='w-full sm:w-auto'>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							buttonClassName='w-full sm:w-auto'
							onClick={handleDeleteReviewCard}
						>
							Delete review card
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<RetireReviewCardDialog
				isPending={isUpdatingReviewCard}
				onConfirm={confirmRetiredToggle}
				onOpenChange={setIsRetireDialogOpen}
				onSeeReviews={handleSeeReviews}
				open={isRetireDialogOpen}
			/>
		</Card>
	)
}

export { toReviewCardStatusBadge } from './reviewCardShared'
