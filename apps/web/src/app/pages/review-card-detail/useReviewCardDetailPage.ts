import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useAutoSave } from '~/hooks/useAutoSave'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { useRevealPanel } from '~/hooks/useRevealPanel'
import { useReviewCard } from '~/modules/review-cards/api/getReviewCard'
import { useUpdateReviewCard } from '~/modules/review-cards/api/updateReviewCard'
import {
	toFreshnessTier,
	toReviewCardStatusBadge,
} from '~/modules/review-cards/components/reviewCardShared'
import { consumeFocusNewReviewCardPrimaryText } from '~/modules/review-cards/createReviewCardIntent'
import { useDeleteReviewCardWithUndo } from '~/modules/review-cards/hooks/useDeleteReviewCardWithUndo'
import { hasScheduledDueReviews } from '~/modules/review-cards/utils/hasScheduledDueReviews'
import { orderReviewCardStatusBadges } from '~/modules/review-cards/utils/orderReviewCardStatusBadges'
import { useCreateReview } from '~/modules/reviews/api/createReview'
import { useReviewsByReviewCard } from '~/modules/reviews/api/getReviews'
import { type ReviewRatingState } from '~/modules/reviews/components/reviewRatingOptions'
import { useDetailReviewCounts } from '~/modules/reviews/hooks/useDetailReviewCounts'
import { useReviewDialog } from '~/modules/reviews/hooks/useReviewDialog'
import {
	getLatestCompletedReview,
	splitReviews,
} from '~/modules/reviews/utils/reviewCollections'
import {
	getReviewCreatedToastActionLabel,
	getReviewCreatedToastDescription,
} from '~/modules/reviews/utils/reviewToastDescription'
import { type SearchResultItem } from '~/modules/search/types/search.types'
import { useCreateTopic } from '~/modules/topics/api/createTopic'
import { useTopic } from '~/modules/topics/api/getTopic'
import { useReviewMode } from '~/stores/ReviewModeContext'
import { localDateString } from '~/utils/date'
import { formatRelativeDate } from '~/utils/formatRelativeDate'

import { type ReviewCardDetailTab } from './shared'
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
	reviewCardId,
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
		error: reviewCardError,
	} = useReviewCard(Number.isNaN(reviewCardId) ? null : reviewCardId)
	const { data: topic } = useTopic(reviewCard?.topicId ?? null)
	const {
		mutateAsync: updateReviewCardAsync,
		isPending: isUpdatingReviewCard,
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
		reviewCard ? { reviewCardId: reviewCard.id } : undefined,
	)
	const reviewTriggerCounts = useMemo(
		() => ({
			pendingCount,
			overdueCount,
			dueTodayCount,
		}),
		[dueTodayCount, overdueCount, pendingCount],
	)
	const { data: reviews, isLoading: isReviewsLoading } =
		useReviewsByReviewCard(reviewCard?.id)
	const resolvedReviews = reviews ?? []
	const {
		uncompletedUnscheduledReviews,
		overdueReviews,
		todayReviews,
		upcomingReviews,
		completedReviews,
	} = useMemo(() => splitReviews(resolvedReviews), [resolvedReviews])
	const latestCompletedReview = useMemo(
		() => getLatestCompletedReview(resolvedReviews),
		[resolvedReviews],
	)

	const metrics = useLearnableMetrics(
		reviewCard
			? {
					retrievability: reviewCard.retrievability,
					freshnessTier: toFreshnessTier(reviewCard.freshnessTier),
					daysUntilNextTier: reviewCard.daysUntilNextTier,
					stability: reviewCard.stability,
					lastReviewedAt: reviewCard.lastReviewedAt,
					inheritedStability: null,
				}
			: null,
	)
	const {
		freshnessTierInfo,
		freshnessTierColor,
		isUnreviewed,
		stabilityText,
	} = metrics

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(
				latestCompletedReview?.completedAt ??
					reviewCard?.lastReviewedAt ??
					null,
				{
					includeFuture: false,
					nullLabel: 'never',
				},
			),
		[latestCompletedReview?.completedAt, reviewCard?.lastReviewedAt],
	)

	const statusBadges = useMemo(
		() =>
			orderReviewCardStatusBadges(reviewCard?.statusBadges ?? []).map(
				apiBadge =>
					toReviewCardStatusBadge(apiBadge, {
						onOpenReviewDialog: openReviewDialog,
					}),
			),
		[reviewCard?.statusBadges, openReviewDialog],
	)

	useEffect(() => {
		if (!reviewCard) return
		setIsRetireDialogOpen(false)
	}, [reviewCard])

	const parentLabel = useMemo(() => {
		if (topic?.title?.trim()) return topic.title
		if (reviewCard?.topicId != null) return `Topic #${reviewCard.topicId}`
		return 'None'
	}, [topic?.title, reviewCard?.topicId])

	const handleUpdateReviewCardFields = useCallback(
		(fields: {
			primaryText?: string
			secondaryText?: string
			notes?: string
			retired?: boolean
			flagged?: boolean
		}) => {
			if (!reviewCard) return

			Promise.resolve(
				updateReviewCardAsync({ id: reviewCard.id, ...fields }),
			).catch(() => {
				toast.error('Failed to update review card')
			})
		},
		[reviewCard, updateReviewCardAsync],
	)

	const saveReviewCardPrimaryText = useCallback(
		(newPrimaryText: string) => {
			if (!reviewCard || newPrimaryText === reviewCard.primaryText) return
			handleUpdateReviewCardFields({ primaryText: newPrimaryText })
		},
		[handleUpdateReviewCardFields, reviewCard],
	)

	const saveReviewCardSecondaryText = useCallback(
		(newSecondaryText: string) => {
			if (!reviewCard || newSecondaryText === reviewCard.secondaryText)
				return
			handleUpdateReviewCardFields({ secondaryText: newSecondaryText })
		},
		[handleUpdateReviewCardFields, reviewCard],
	)

	const saveReviewCardNotes = useCallback(
		(newNotes: string) => {
			if (!reviewCard || newNotes === reviewCard.notes) return
			handleUpdateReviewCardFields({ notes: newNotes })
		},
		[handleUpdateReviewCardFields, reviewCard],
	)

	const {
		value: primaryText,
		onChange: onPrimaryTextChange,
		flush: flushPrimaryText,
	} = useAutoSave({
		initialValue: reviewCard?.primaryText ?? '',
		onSave: saveReviewCardPrimaryText,
		key: `review-card-primary-text-${reviewCard?.id ?? 'new'}`,
	})
	const {
		value: secondaryText,
		onChange: onSecondaryTextChange,
		setValue: setSecondaryText,
		flush: flushSecondaryText,
	} = useAutoSave({
		initialValue: reviewCard?.secondaryText ?? '',
		onSave: saveReviewCardSecondaryText,
		key: `review-card-secondary-text-${reviewCard?.id ?? 'new'}`,
	})
	const {
		value: notes,
		onChange: onNotesChange,
		setValue: setNotes,
		flush: flushNotes,
	} = useAutoSave({
		initialValue: reviewCard?.notes ?? '',
		onSave: saveReviewCardNotes,
		key: `review-card-notes-${reviewCard?.id ?? 'new'}`,
	})

	const {
		revealPanelTab,
		setRevealPanelTab,
		guessText: guessSecondaryText,
		setGuessText: setGuessSecondaryText,
		isCopied: isRevealPanelCopied,
		handleCopyGuessText,
		handleCopyRevealText,
	} = useRevealPanel({
		revealText: secondaryText,
		entityId: reviewCard?.id ?? null,
		hidesSecondary,
		defaultTab: hidesSecondary ? null : 'reveal',
	})

	const handleRetiredToggle = useCallback(() => {
		if (!reviewCard) return
		if (!reviewCard.retired && hasScheduledDueReviews(reviewCard)) {
			setIsRetireDialogOpen(true)
			return
		}

		handleUpdateReviewCardFields({
			retired: !reviewCard.retired,
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
			search: { tab: 'reviews' },
		})
	}, [navigate, onActiveTabChange, reviewCard])

	const handleRatingSelect = useCallback(
		async (ratingState: ReviewRatingState) => {
			if (!reviewCard || createReviewMutation.isPending) return

			try {
				const review = await createReviewMutation.mutateAsync({
					reviewCardId: reviewCard.id,
					rating: ratingState === 'uncompleted' ? null : ratingState,
					description: '',
					scheduledAt: null,
					completedAt:
						ratingState === 'uncompleted'
							? null
							: localDateString(),
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
						onClick: () => openReviewDialog(review.id),
					},
				})
			} catch {
				toast.error('Failed to create review')
			}
		},
		[
			createReviewMutation,
			onCompletedReviewCreated,
			openReviewDialog,
			reviewCard,
		],
	)

	const handleDeleteReviewCard = useCallback(() => {
		if (!reviewCard) return

		const navigateAway = () => {
			if (reviewCard.topicId != null) {
				navigate({
					to: '/topics/$topicId',
					params: { topicId: reviewCard.topicId.toString() },
				})
				return
			}
			navigate({ to: '/library' })
		}

		setIsDeleteDialogOpen(false)
		deleteWithUndo(reviewCard.id, {
			onOptimisticDelete: navigateAway,
			onUndo: () => {
				navigate({
					to: '/review-cards/$reviewCardId',
					params: { reviewCardId: reviewCard.id.toString() },
					search: { tab: 'home' },
				})
			},
		})
	}, [deleteWithUndo, navigate, reviewCard])

	const handleConvertType = useCallback(async () => {
		if (!reviewCard || isTypeMutationPending) return

		const newType =
			reviewCard.type === 'practice' ? 'flashcard' : 'practice'
		setIsTypeMutationPending(true)
		try {
			await updateReviewCardAsync({ id: reviewCard.id, type: newType })
			toast.success(
				`Converted to ${newType === 'practice' ? 'Practice' : 'Flashcard'}`,
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
				entity.entityType !== 'topic' ||
				!entity.topic ||
				isTopicMutationPending
			) {
				return
			}

			if (entity.topic.id === reviewCard.topicId) {
				setIsTopicSearchOpen(false)
				return
			}

			setIsTopicMutationPending(true)
			try {
				await updateReviewCardAsync({
					id: reviewCard.id,
					topicId: entity.topic.id,
				})
				toast.success('Topic changed')
				setIsTopicSearchOpen(false)
			} catch {
				toast.error('Failed to change topic')
			} finally {
				setIsTopicMutationPending(false)
			}
		},
		[isTopicMutationPending, reviewCard, updateReviewCardAsync],
	)

	const handleCreateAndAssignTopic = useCallback(async () => {
		if (!reviewCard || isTopicMutationPending) return

		setIsTopicMutationPending(true)
		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parentId: null,
			})

			try {
				await updateReviewCardAsync({
					id: reviewCard.id,
					topicId: created.id,
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
		updateReviewCardAsync,
	])

	const handleTabChange = useCallback(
		(tab: ReviewCardDetailTab) => {
			setFallbackActiveTab(tab)
			onActiveTabChange?.(tab)
		},
		[onActiveTabChange],
	)

	const handleNavigateToTopic = useCallback(() => {
		if (!reviewCard) return
		navigate({
			to: '/topics/$topicId',
			params: { topicId: reviewCard.topicId.toString() },
		})
	}, [navigate, reviewCard])

	const handleOpenFullPage = useCallback(() => {
		if (!reviewCard) return
		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: reviewCard.id.toString() },
			search: { tab: resolvedActiveTab },
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
		handleCreateAndAssignTopic,
	}
}
