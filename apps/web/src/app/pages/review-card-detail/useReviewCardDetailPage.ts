import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useReviewCard } from '~/features/review-cards/api/getReviewCard'
import { useUpdateReviewCard } from '~/features/review-cards/api/updateReviewCard'
import {
	toFreshnessTier,
	toReviewCardStatusBadge
} from '~/features/review-cards/components/reviewCardShared'
import { consumeFocusNewReviewCardPrimaryText } from '~/features/review-cards/createReviewCardIntent'
import { useDeleteReviewCardWithUndo } from '~/features/review-cards/hooks/useDeleteReviewCardWithUndo'
import { hasScheduledDueReviews } from '~/features/review-cards/utils/hasScheduledDueReviews'
import { orderReviewCardStatusBadges } from '~/features/review-cards/utils/orderReviewCardStatusBadges'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviewsByReviewCard } from '~/features/reviews/api/getReviews'
import type { ReviewRatingState } from '~/features/reviews/components/reviewRatingOptions'
import { useDetailReviewCounts } from '~/features/reviews/hooks/useDetailReviewCounts'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import {
	getLatestCompletedReview,
	splitReviews
} from '~/features/reviews/utils/reviewCollections'
import {
	getReviewCreatedToastActionLabel,
	getReviewCreatedToastDescription
} from '~/features/reviews/utils/reviewToastDescription'
import type { SearchResultItem } from '~/features/search/types/search.types'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopic } from '~/features/topics/api/getTopic'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { useRevealPanel } from '~/hooks/useRevealPanel'
import { useReviewMode } from '~/stores/ReviewModeContext'
import { localDateString } from '~/utils/date'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import type { ReviewCardDetailTab } from './shared'
import { isReviewCardDetailTab } from './shared'

type UseReviewCardDetailPageOptions = {
	activeTab?: ReviewCardDetailTab | string
	onActiveTabChange?: (tab: ReviewCardDetailTab) => void
	onCompletedReviewCreated?: () => void
	reviewCardId: number
}

export function useReviewCardDetailPage({
	activeTab,
	onActiveTabChange,
	onCompletedReviewCreated,
	reviewCardId
}: UseReviewCardDetailPageOptions) {
	const navigate = useNavigate()
	const [fallbackActiveTab, setFallbackActiveTab] =
		useState<ReviewCardDetailTab>('home')
	const resolvedActiveTab: ReviewCardDetailTab =
		activeTab != null && isReviewCardDetailTab(activeTab)
			? activeTab
			: fallbackActiveTab

	const primaryTextTextareaRef = useRef<HTMLTextAreaElement>(null)
	const {
		data: reviewCard,
		isLoading,
		error: reviewCardError
	} = useReviewCard(Number.isNaN(reviewCardId) ? null : reviewCardId)
	const { data: topic } = useTopic(reviewCard?.topic_id ?? null)
	const {
		mutateAsync: updateReviewCardAsync,
		isPending: isUpdatingReviewCard
	} = useUpdateReviewCard()
	const { mutateAsync: createTopicAsync } = useCreateTopic()
	const { deleteWithUndo } = useDeleteReviewCardWithUndo()
	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()
	const { hidesSecondary } = useReviewMode()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [isRetireDialogOpen, setIsRetireDialogOpen] = useState(false)
	const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false)
	const [isTopicSearchOpen, setIsTopicSearchOpen] = useState(false)
	const [topicSearchQuery, setTopicSearchQuery] = useState('')
	const [isTopicMutationPending, setIsTopicMutationPending] = useState(false)
	const [isTypeMutationPending, setIsTypeMutationPending] = useState(false)

	useEffect(() => {
		if (!reviewCard || resolvedActiveTab !== 'home') return
		if (!consumeFocusNewReviewCardPrimaryText(reviewCard.id)) return

		primaryTextTextareaRef.current?.focus()
	}, [resolvedActiveTab, reviewCard])

	const { pendingCount, overdueCount, dueTodayCount } = useDetailReviewCounts(
		reviewCard ? { reviewCardId: reviewCard.id } : undefined
	)
	const reviewTriggerCounts = useMemo(
		() => ({
			pendingCount,
			overdueCount,
			dueTodayCount
		}),
		[dueTodayCount, overdueCount, pendingCount]
	)
	const { data: reviews, isLoading: isReviewsLoading } = useReviewsByReviewCard(
		reviewCard?.id
	)
	const resolvedReviews = reviews ?? []
	const {
		uncompletedUnscheduledReviews,
		overdueReviews,
		todayReviews,
		upcomingReviews,
		completedReviews
	} = useMemo(() => splitReviews(resolvedReviews), [resolvedReviews])
	const latestCompletedReview = useMemo(
		() => getLatestCompletedReview(resolvedReviews),
		[resolvedReviews]
	)

	const metrics = useLearnableMetrics(
		reviewCard
			? {
					retrievability: reviewCard.retrievability,
					freshness_tier: toFreshnessTier(reviewCard.freshness_tier),
					days_until_next_tier: reviewCard.days_until_next_tier,
					stability: reviewCard.stability,
					last_reviewed_at: reviewCard.last_reviewed_at,
					inherited_stability: null
				}
			: null
	)
	const { freshnessTierInfo, freshnessTierColor, isUnreviewed, stabilityText } =
		metrics

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(
				latestCompletedReview?.completed_at ??
					reviewCard?.last_reviewed_at ??
					null,
				{
					includeFuture: false,
					nullLabel: 'never'
				}
			),
		[latestCompletedReview?.completed_at, reviewCard?.last_reviewed_at]
	)

	const statusBadges = useMemo(
		() =>
			orderReviewCardStatusBadges(reviewCard?.status_badges ?? []).map(
				apiBadge =>
					toReviewCardStatusBadge(apiBadge, {
						onOpenReviewDialog: openReviewDialog
					})
			),
		[reviewCard?.status_badges, openReviewDialog]
	)

	useEffect(() => {
		if (!reviewCard) return
		setIsRetireDialogOpen(false)
	}, [reviewCard])

	const parentLabel = useMemo(() => {
		if (topic?.title?.trim()) return topic.title
		if (reviewCard?.topic_id != null) return `Topic #${reviewCard.topic_id}`
		return 'None'
	}, [topic?.title, reviewCard?.topic_id])

	const handleUpdateReviewCardFields = useCallback(
		(fields: {
			primary_text?: string
			secondary_text?: string
			notes?: string
			retired?: boolean
			flagged?: boolean
		}) => {
			if (!reviewCard) return

			Promise.resolve(
				updateReviewCardAsync({ id: reviewCard.id, ...fields })
			).catch(() => {
				toast.error('Failed to update review card')
			})
		},
		[reviewCard, updateReviewCardAsync]
	)

	const saveReviewCardPrimaryText = useCallback(
		(newPrimaryText: string) => {
			if (!reviewCard || newPrimaryText === reviewCard.primary_text) return
			handleUpdateReviewCardFields({ primary_text: newPrimaryText })
		},
		[handleUpdateReviewCardFields, reviewCard]
	)

	const saveReviewCardSecondaryText = useCallback(
		(newSecondaryText: string) => {
			if (!reviewCard || newSecondaryText === reviewCard.secondary_text) return
			handleUpdateReviewCardFields({ secondary_text: newSecondaryText })
		},
		[handleUpdateReviewCardFields, reviewCard]
	)

	const saveReviewCardNotes = useCallback(
		(newNotes: string) => {
			if (!reviewCard || newNotes === reviewCard.notes) return
			handleUpdateReviewCardFields({ notes: newNotes })
		},
		[handleUpdateReviewCardFields, reviewCard]
	)

	const {
		value: primaryText,
		onChange: onPrimaryTextChange,
		flush: flushPrimaryText
	} = useAutoSave({
		initialValue: reviewCard?.primary_text ?? '',
		onSave: saveReviewCardPrimaryText,
		key: `review-card-primary-text-${reviewCard?.id ?? 'new'}`
	})
	const {
		value: secondaryText,
		onChange: onSecondaryTextChange,
		setValue: setSecondaryText,
		flush: flushSecondaryText
	} = useAutoSave({
		initialValue: reviewCard?.secondary_text ?? '',
		onSave: saveReviewCardSecondaryText,
		key: `review-card-secondary-text-${reviewCard?.id ?? 'new'}`
	})
	const {
		value: notes,
		onChange: onNotesChange,
		setValue: setNotes,
		flush: flushNotes
	} = useAutoSave({
		initialValue: reviewCard?.notes ?? '',
		onSave: saveReviewCardNotes,
		key: `review-card-notes-${reviewCard?.id ?? 'new'}`
	})

	const {
		revealPanelTab,
		setRevealPanelTab,
		guessText: guessSecondaryText,
		setGuessText: setGuessSecondaryText,
		isCopied: isRevealPanelCopied,
		handleCopyGuessText,
		handleCopyRevealText
	} = useRevealPanel({
		revealText: secondaryText,
		entityId: reviewCard?.id ?? null,
		hidesSecondary,
		defaultTab: hidesSecondary ? null : 'reveal'
	})

	const handleRetiredToggle = useCallback(() => {
		if (!reviewCard) return
		if (!reviewCard.retired && hasScheduledDueReviews(reviewCard)) {
			setIsRetireDialogOpen(true)
			return
		}

		handleUpdateReviewCardFields({
			retired: !reviewCard.retired
		})
	}, [handleUpdateReviewCardFields, reviewCard])

	const handleSeeReviews = useCallback(() => {
		if (!reviewCard) return

		setIsRetireDialogOpen(false)
		if (onActiveTabChange) {
			onActiveTabChange('reviews')
			return
		}

		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: reviewCard.id.toString() },
			search: { tab: 'reviews' }
		})
	}, [navigate, onActiveTabChange, reviewCard])

	const handleRatingSelect = useCallback(
		async (ratingState: ReviewRatingState) => {
			if (!reviewCard || createReviewMutation.isPending) return

			try {
				const review = await createReviewMutation.mutateAsync({
					review_card_id: reviewCard.id,
					rating: ratingState === 'uncompleted' ? null : ratingState,
					description: '',
					scheduled_at: null,
					completed_at: ratingState === 'uncompleted' ? null : localDateString()
				})

				if (ratingState === 'uncompleted') {
					openReviewDialog(review.id)
					return
				}
				onCompletedReviewCreated?.()

				toast('Review created', {
					description: getReviewCreatedToastDescription(review),
					action: {
						label: getReviewCreatedToastActionLabel(review),
						onClick: () => openReviewDialog(review.id)
					}
				})
			} catch {
				toast.error('Failed to create review')
			}
		},
		[
			createReviewMutation,
			onCompletedReviewCreated,
			openReviewDialog,
			reviewCard
		]
	)

	const handleDeleteReviewCard = useCallback(() => {
		if (!reviewCard) return

		const navigateAway = () => {
			if (reviewCard.topic_id != null) {
				navigate({
					to: '/topics/$topicId',
					params: { topicId: reviewCard.topic_id.toString() }
				})
				return
			}
			navigate({ to: '/topics' })
		}

		setIsDeleteDialogOpen(false)
		deleteWithUndo(reviewCard.id, {
			onOptimisticDelete: navigateAway,
			onUndo: () => {
				navigate({
					to: '/review-cards/$reviewCardId',
					params: { reviewCardId: reviewCard.id.toString() },
					search: { tab: 'home' }
				})
			}
		})
	}, [deleteWithUndo, navigate, reviewCard])

	const handleConvertType = useCallback(async () => {
		if (!reviewCard || isTypeMutationPending) return

		const newType = reviewCard.type === 'practice' ? 'flashcard' : 'practice'
		setIsTypeMutationPending(true)
		try {
			await updateReviewCardAsync({ id: reviewCard.id, type: newType })
			toast.success(
				`Converted to ${newType === 'practice' ? 'Practice' : 'Flashcard'}`
			)
		} catch {
			toast.error('Failed to convert card')
		} finally {
			setIsTypeMutationPending(false)
		}
	}, [reviewCard, isTypeMutationPending, updateReviewCardAsync])

	const handleOpenTopicSearch = useCallback(() => {
		if (isTopicMutationPending || isUpdatingReviewCard) return
		setTopicSearchQuery('')
		setIsTopicSearchOpen(true)
	}, [isTopicMutationPending, isUpdatingReviewCard])

	const handleAssignTopic = useCallback(
		async (entity: SearchResultItem) => {
			if (
				!reviewCard ||
				entity.entity_type !== 'topic' ||
				!entity.topic ||
				isTopicMutationPending
			) {
				return
			}

			if (entity.topic.id === reviewCard.topic_id) {
				setIsTopicSearchOpen(false)
				return
			}

			setIsTopicMutationPending(true)
			try {
				await updateReviewCardAsync({
					id: reviewCard.id,
					topic_id: entity.topic.id
				})
				toast.success('Topic changed')
				setIsTopicSearchOpen(false)
			} catch {
				toast.error('Failed to change topic')
			} finally {
				setIsTopicMutationPending(false)
			}
		},
		[isTopicMutationPending, reviewCard, updateReviewCardAsync]
	)

	const handleCreateAndAssignTopic = useCallback(async () => {
		if (!reviewCard || isTopicMutationPending) return

		setIsTopicMutationPending(true)
		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: null
			})

			try {
				await updateReviewCardAsync({
					id: reviewCard.id,
					topic_id: created.id
				})
				toast.success('Topic changed')
				setIsTopicSearchOpen(false)
			} catch {
				toast.error('Topic created but failed to assign')
			}
		} catch {
			toast.error('Failed to create topic')
		} finally {
			setIsTopicMutationPending(false)
		}
	}, [
		createTopicAsync,
		isTopicMutationPending,
		reviewCard,
		updateReviewCardAsync
	])

	const handleTabChange = useCallback(
		(tab: ReviewCardDetailTab) => {
			setFallbackActiveTab(tab)
			onActiveTabChange?.(tab)
		},
		[onActiveTabChange]
	)

	const handleNavigateToTopic = useCallback(() => {
		if (!reviewCard) return
		navigate({
			to: '/topics/$topicId',
			params: { topicId: reviewCard.topic_id.toString() }
		})
	}, [navigate, reviewCard])

	const handleOpenFullPage = useCallback(() => {
		if (!reviewCard) return
		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: reviewCard.id.toString() },
			search: { tab: resolvedActiveTab }
		})
	}, [navigate, resolvedActiveTab, reviewCard])

	return {
		secondaryText,
		completedReviews,
		createReviewMutation,
		dueTodayCount,
		error: reviewCardError,
		flushPrimaryText,
		flushNotes,
		flushSecondaryText,
		freshnessTierColor,
		freshnessTierInfo,
		guessSecondaryText,
		handleAssignTopic,
		handleConvertType,
		handleCopyGuessText,
		handleCopyRevealText,
		handleDeleteReviewCard,
		handleNavigateToTopic,
		handleOpenFullPage,
		handleOpenTopicSearch,
		handleRatingSelect,
		handleRetiredToggle,
		handleSeeReviews,
		handleTabChange,
		handleUpdateReviewCardFields,
		hidesSecondary,
		isDeleteDialogOpen,
		isLoading,
		isRevealPanelCopied,
		isRetireDialogOpen,
		isReviewsLoading,
		isTopicMenuOpen,
		isTopicMutationPending,
		isTopicSearchOpen,
		isTypeMutationPending,
		isUnreviewed,
		isUpdatingReviewCard,
		lastReviewed,
		latestCompletedReview,
		notes,
		onPrimaryTextChange,
		onNotesChange,
		onSecondaryTextChange,
		openReviewDialog,
		onCompletedReviewCreated,
		overdueCount,
		overdueReviews,
		parentLabel,
		primaryText,
		primaryTextTextareaRef,
		resolvedActiveTab,
		resolvedReviews,
		revealPanelTab,
		reviewCard,
		reviewTriggerCounts,
		setSecondaryText,
		setNotes,
		setGuessSecondaryText,
		setIsDeleteDialogOpen,
		setIsRetireDialogOpen,
		setIsTopicMenuOpen,
		setIsTopicSearchOpen,
		setRevealPanelTab,
		setTopicSearchQuery,
		stabilityText,
		statusBadges,
		todayReviews,
		topicSearchQuery,
		uncompletedUnscheduledReviews,
		pendingCount,
		upcomingReviews,
		handleCreateAndAssignTopic
	}
}
