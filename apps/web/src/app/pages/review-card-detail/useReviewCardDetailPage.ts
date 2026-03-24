import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useDeleteReviewCard } from '~/features/review-cards/api/deleteReviewCard'
import { useReviewCard } from '~/features/review-cards/api/getReviewCard'
import { useUpdateReviewCard } from '~/features/review-cards/api/updateReviewCard'
import { consumeFocusNewReviewCardPrompt } from '~/features/review-cards/createReviewCardIntent'
import {
	toFreshnessTier,
	toReviewCardBadge
} from '~/features/review-cards/components/reviewCardShared'
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
	reviewCardId: number
}

export function useReviewCardDetailPage({
	activeTab,
	onActiveTabChange,
	reviewCardId
}: UseReviewCardDetailPageOptions) {
	const navigate = useNavigate()
	const [fallbackActiveTab, setFallbackActiveTab] =
		useState<ReviewCardDetailTab>('home')
	const resolvedActiveTab: ReviewCardDetailTab =
		activeTab != null && isReviewCardDetailTab(activeTab)
			? activeTab
			: fallbackActiveTab

	const promptTextareaRef = useRef<HTMLTextAreaElement>(null)
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
	const {
		mutateAsync: deleteReviewCardAsync,
		isPending: isDeletingReviewCard
	} = useDeleteReviewCard()
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
		if (!consumeFocusNewReviewCardPrompt(reviewCard.id)) return

		promptTextareaRef.current?.focus()
	}, [resolvedActiveTab, reviewCard])

	const { unscheduledCount, overdueCount, dueTodayCount } =
		useDetailReviewCounts(
			reviewCard ? { reviewCardId: reviewCard.id } : undefined
		)
	const reviewTriggerCounts = useMemo(
		() => ({
			unscheduledCount,
			overdueCount,
			dueTodayCount
		}),
		[dueTodayCount, overdueCount, unscheduledCount]
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
					toReviewCardBadge(apiBadge, {
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
			prompt?: string
			answer?: string
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

	const saveReviewCardPrompt = useCallback(
		(newPrompt: string) => {
			if (!reviewCard || newPrompt === reviewCard.prompt) return
			handleUpdateReviewCardFields({ prompt: newPrompt })
		},
		[handleUpdateReviewCardFields, reviewCard]
	)

	const saveReviewCardAnswer = useCallback(
		(newAnswer: string) => {
			if (!reviewCard || newAnswer === reviewCard.answer) return
			handleUpdateReviewCardFields({ answer: newAnswer })
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
		value: prompt,
		onChange: onPromptChange,
		flush: flushPrompt
	} = useAutoSave({
		initialValue: reviewCard?.prompt ?? '',
		onSave: saveReviewCardPrompt,
		key: `review-card-prompt-${reviewCard?.id ?? 'new'}`
	})
	const {
		value: answer,
		onChange: onAnswerChange,
		setValue: setAnswer,
		flush: flushAnswer
	} = useAutoSave({
		initialValue: reviewCard?.answer ?? '',
		onSave: saveReviewCardAnswer,
		key: `review-card-answer-${reviewCard?.id ?? 'new'}`
	})
	const {
		value: notes,
		onChange: onNotesChange,
		flush: flushNotes
	} = useAutoSave({
		initialValue: reviewCard?.notes ?? '',
		onSave: saveReviewCardNotes,
		key: `review-card-notes-${reviewCard?.id ?? 'new'}`
	})

	const {
		revealPanelTab,
		setRevealPanelTab,
		guessText: guessAnswerText,
		setGuessText: setGuessAnswerText,
		isCopied: isRevealPanelCopied,
		handleCopyGuessText,
		handleCopyRevealText
	} = useRevealPanel({
		revealText: answer,
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
		[createReviewMutation, openReviewDialog, reviewCard]
	)

	const handleDeleteReviewCard = useCallback(async () => {
		if (!reviewCard || isDeletingReviewCard) return

		try {
			await deleteReviewCardAsync(reviewCard.id)
			setIsDeleteDialogOpen(false)
			toast.success('Review card deleted')

			if (reviewCard.topic_id != null) {
				navigate({
					to: '/topics/$topicId',
					params: { topicId: reviewCard.topic_id.toString() }
				})
				return
			}

			navigate({ to: '/topics' })
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete review card'
			)
		}
	}, [deleteReviewCardAsync, isDeletingReviewCard, navigate, reviewCard])

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

	const isAnswerEmpty = answer.trim().length === 0

	return {
		answer,
		completedReviews,
		createReviewMutation,
		dueTodayCount,
		error: reviewCardError,
		flushAnswer,
		flushNotes,
		flushPrompt,
		freshnessTierColor,
		freshnessTierInfo,
		guessAnswerText,
		handleAssignTopic,
		handleConvertType,
		handleCopyGuessText,
		handleCopyRevealText,
		handleDeleteReviewCard,
		handleNavigateToTopic,
		handleOpenTopicSearch,
		handleRatingSelect,
		handleRetiredToggle,
		handleSeeReviews,
		handleTabChange,
		handleUpdateReviewCardFields,
		hidesSecondary,
		isAnswerEmpty,
		isDeleteDialogOpen,
		isDeletingReviewCard,
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
		onAnswerChange,
		onNotesChange,
		onPromptChange,
		openReviewDialog,
		overdueCount,
		overdueReviews,
		parentLabel,
		prompt,
		promptTextareaRef,
		resolvedActiveTab,
		resolvedReviews,
		revealPanelTab,
		reviewCard,
		reviewTriggerCounts,
		setAnswer,
		setGuessAnswerText,
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
		unscheduledCount,
		upcomingReviews,
		handleCreateAndAssignTopic
	}
}
