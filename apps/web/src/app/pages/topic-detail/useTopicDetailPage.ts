import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useCreateReviewCard } from '~/features/review-cards/api/createReviewCard'
import { useReviewCards } from '~/features/review-cards/api/getReviewCards'
import { requestFocusNewReviewCardPrompt } from '~/features/review-cards/createReviewCardIntent'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { useTopic } from '~/features/topics/api/getTopic'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import { consumeFocusNewTopicTitle } from '~/features/topics/createTopicIntent'
import { useTopicTree } from '~/features/topics/hooks/useTopicTree'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useRevealPanel } from '~/hooks/useRevealPanel'
import { useReviewMode } from '~/stores/ReviewModeContext'
import type { TopicDetailReviewCardFilter } from './shared'
import { isTopicDetailReviewCardFilter } from './shared'

type TopicDetailPageProps = {
	topicId: number
	cardTypeFilter?: TopicDetailReviewCardFilter | string
	onCardTypeFilterChange: (filter: TopicDetailReviewCardFilter) => void
}

export function useTopicDetailPage({
	topicId,
	cardTypeFilter = 'all',
	onCardTypeFilterChange
}: TopicDetailPageProps) {
	const navigate = useNavigate()
	const resolvedCardTypeFilter = isTopicDetailReviewCardFilter(cardTypeFilter)
		? cardTypeFilter
		: 'all'
	const {
		data: topic,
		isLoading: isTopicLoading,
		error: topicError
	} = useTopic(topicId)
	const { ancestorIdsById, nodeById } = useTopicTree()
	const { mutateAsync: updateTopicAsync } = useUpdateTopic()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const {
		mutateAsync: createReviewCardAsync,
		isPending: isCreatingReviewCard
	} = useCreateReviewCard()

	const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
	const { hidesSecondary } = useReviewMode()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollContainerRef.current, [])

	useEffect(() => {
		if (!topic) return
		if (!consumeFocusNewTopicTitle(topic.id)) return

		titleTextareaRef.current?.focus()
	}, [topic])

	const selectedCardType = useMemo(() => {
		if (resolvedCardTypeFilter === 'all') return
		return resolvedCardTypeFilter
	}, [resolvedCardTypeFilter])

	const topicPath = useMemo(() => {
		if (!topic) return []

		const ancestorIds = ancestorIdsById.get(topic.id)
		if (!ancestorIds || ancestorIds.length === 0) {
			return [topic]
		}

		const pathTopics = ancestorIds
			.map(ancestorId => nodeById.get(ancestorId))
			.filter(topicNode => topicNode != null)

		return [...pathTopics, topic]
	}, [ancestorIdsById, nodeById, topic])

	const { data: reviewCards = [], isLoading: isCardsLoading } = useReviewCards({
		topic_id: topicId,
		type: selectedCardType,
		order: 'desc'
	})

	const updateTopicFields = useCallback(
		async (fields: {
			title?: string
			body?: string
			parent_id?: number | null
		}) => {
			if (!topic) return
			try {
				await updateTopicAsync({ id: topic.id, ...fields })
			} catch {
				toast.error('Failed to update topic')
			}
		},
		[topic, updateTopicAsync]
	)

	const saveTopicTitle = useCallback(
		(newTitle: string) => {
			if (!topic || newTitle === topic.title) return
			updateTopicFields({ title: newTitle }).catch(() => {})
		},
		[topic, updateTopicFields]
	)

	const saveTopicBody = useCallback(
		(newBody: string) => {
			if (!topic || newBody === topic.body) return
			updateTopicFields({ body: newBody }).catch(() => {})
		},
		[topic, updateTopicFields]
	)

	const {
		value: title,
		onChange: onTitleChange,
		flush: flushTitle
	} = useAutoSave({
		initialValue: topic?.title ?? '',
		onSave: saveTopicTitle,
		key: `topic-title-${topic?.id ?? 'new'}`
	})

	const {
		value: body,
		onChange: onBodyChange,
		setValue: setBody,
		flush: flushBody
	} = useAutoSave({
		initialValue: topic?.body ?? '',
		onSave: saveTopicBody,
		key: `topic-body-${topic?.id ?? 'new'}`
	})

	const {
		revealPanelTab,
		setRevealPanelTab,
		guessText: guessBodyText,
		setGuessText: setGuessBodyText,
		isCopied: isRevealPanelCopied,
		handleCopyGuessText,
		handleCopyRevealText
	} = useRevealPanel({
		revealText: body,
		entityId: topic?.id ?? null,
		hidesSecondary,
		defaultTab: hidesSecondary ? null : 'reveal'
	})

	const handleAddReviewCard = useCallback(
		async (type: 'practice' | 'flashcard') => {
			if (!topic) return
			try {
				const created = await createReviewCardAsync({
					topic_id: topic.id,
					type,
					prompt: '',
					answer: '',
					retired: false
				})
				requestFocusNewReviewCardPrompt(created.id)
				navigate({
					to: '/review-cards/$reviewCardId',
					params: { reviewCardId: created.id.toString() },
					search: { tab: 'home' }
				})
			} catch {
				toast.error('Failed to create review card')
			}
		},
		[createReviewCardAsync, navigate, topic]
	)

	const handleDeleteTopic = useCallback(async () => {
		if (!topic || isDeletingTopic) return
		try {
			await deleteTopicAsync(topic.id)
			setIsDeleteDialogOpen(false)
			toast.success('Topic deleted')
			navigate({ to: '/topics' })
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete topic'
			)
		}
	}, [deleteTopicAsync, isDeletingTopic, navigate, topic])

	const handleOpenReviewCard = useCallback(
		(reviewCardId: number) => {
			navigate({
				to: '/review-cards/$reviewCardId',
				params: { reviewCardId: reviewCardId.toString() },
				search: { tab: 'home' }
			})
		},
		[navigate]
	)

	const isBodyEmpty = body.trim().length === 0

	return {
		body,
		flushBody,
		flushTitle,
		getScrollElement,
		guessBodyText,
		handleAddReviewCard,
		handleCopyGuessText,
		handleCopyRevealText,
		handleDeleteTopic,
		handleOpenReviewCard,
		hidesSecondary,
		isBodyEmpty,
		isCardsLoading,
		isCreatingReviewCard,
		isDeleteDialogOpen,
		isDeletingTopic,
		isRevealPanelCopied,
		isTopicLoading,
		onBodyChange,
		onCardTypeFilterChange,
		onTitleChange,
		resolvedCardTypeFilter,
		revealPanelTab,
		reviewCards,
		scrollContainerRef,
		setBody,
		setGuessBodyText,
		setIsDeleteDialogOpen,
		setRevealPanelTab,
		title,
		titleTextareaRef,
		topic,
		topicError,
		topicPath
	}
}
