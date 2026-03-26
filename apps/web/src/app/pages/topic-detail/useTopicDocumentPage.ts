import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { useReviewCards } from '~/features/review-cards/api/getReviewCards'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { useTopic } from '~/features/topics/api/getTopic'
import { useTopics } from '~/features/topics/api/getTopics'
import { consumeFocusNewTopicTitle } from '~/features/topics/createTopicIntent'
import { useTopicTree } from '~/features/topics/hooks/useTopicTree'
import type { TopicDetailReviewCardFilter } from './shared'
import { isTopicDetailReviewCardFilter } from './shared'
import {
	buildTopicDocumentRoot,
	flattenTopicDocumentSectionIds,
	getTopicDocumentLabel,
	groupReviewCardsByTopicId
} from './topicDocumentUtils'
import { useTopicDocumentNavigation } from './useTopicDocumentNavigation'

type UseTopicDocumentPageOptions = {
	cardTypeFilter?: TopicDetailReviewCardFilter | string
	onCardTypeFilterChange: (filter: TopicDetailReviewCardFilter) => void
	topicId: number
}

export function useTopicDocumentPage({
	cardTypeFilter = 'all',
	onCardTypeFilterChange,
	topicId
}: UseTopicDocumentPageOptions) {
	const navigate = useNavigate()
	const resolvedCardTypeFilter = isTopicDetailReviewCardFilter(cardTypeFilter)
		? cardTypeFilter
		: 'all'
	const {
		data: topic,
		error: topicError,
		isLoading: isTopicLoading
	} = useTopic(topicId)
	const {
		ancestorIdsById,
		isLoading: isTopicTreeLoading,
		nodeById
	} = useTopicTree()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const { data: subtreeTopics = [], isLoading: isSubtreeTopicsLoading } =
		useTopics({
			subtree_of: topicId,
			sort: 'title',
			order: 'asc'
		})
	const { data: reviewCards = [], isLoading: isReviewCardsLoading } =
		useReviewCards({
			topic_id: topicId,
			include_descendants: true,
			order: 'desc'
		})
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [shouldAutoFocusRootTitle, setShouldAutoFocusRootTitle] =
		useState(false)
	const [sectionFilterOverrides, setSectionFilterOverrides] = useState<
		Record<number, TopicDetailReviewCardFilter>
	>({})
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const { collapsedSections, toggleSection } = useSectionCollapse()

	const subtreeTopicsWithRoot = useMemo(() => {
		if (!topic) return subtreeTopics
		if (subtreeTopics.some(subtreeTopic => subtreeTopic.id === topic.id)) {
			return subtreeTopics
		}

		return [topic, ...subtreeTopics]
	}, [subtreeTopics, topic])

	const rootSection = useMemo(
		() => buildTopicDocumentRoot(subtreeTopicsWithRoot, topicId),
		[subtreeTopicsWithRoot, topicId]
	)
	const sectionIds = useMemo(
		() => flattenTopicDocumentSectionIds(rootSection),
		[rootSection]
	)
	const topicReviewCardsById = useMemo(
		() => groupReviewCardsByTopicId(reviewCards),
		[reviewCards]
	)
	const topicPath = useMemo(() => {
		if (!topic) return []

		const ancestorIds = ancestorIdsById.get(topic.id)
		if (!ancestorIds || ancestorIds.length === 0) {
			return [topic]
		}

		const pathTopics = ancestorIds
			.map(ancestorId => nodeById.get(ancestorId))
			.filter(pathTopic => pathTopic != null)

		return [...pathTopics, topic]
	}, [ancestorIdsById, nodeById, topic])
	const { activeSectionId, registerSectionRef, scrollToSection } =
		useTopicDocumentNavigation({
			rootTopicId: topicId,
			scrollContainerRef,
			sectionIds
		})

	const getScrollElement = useCallback(() => scrollContainerRef.current, [])

	const handleGlobalFilterChange = useCallback(
		(filter: TopicDetailReviewCardFilter) => {
			setSectionFilterOverrides({})
			onCardTypeFilterChange(filter)
		},
		[onCardTypeFilterChange]
	)

	const handleSectionFilterChange = useCallback(
		(topicFilterId: number, filter: TopicDetailReviewCardFilter) => {
			setSectionFilterOverrides(previousOverrides => {
				if (filter === resolvedCardTypeFilter) {
					const { [topicFilterId]: _removedOverride, ...remainingOverrides } =
						previousOverrides
					return remainingOverrides
				}

				return {
					...previousOverrides,
					[topicFilterId]: filter
				}
			})
		},
		[resolvedCardTypeFilter]
	)

	const handleDeleteTopic = useCallback(async () => {
		if (!topic || isDeletingTopic) return

		try {
			await deleteTopicAsync(topic.id)
			setIsDeleteDialogOpen(false)
			toast.success('Topic deleted')

			if (topic.parent_id != null && nodeById.has(topic.parent_id)) {
				await navigate({
					to: '/topics/$topicId',
					params: { topicId: topic.parent_id.toString() }
				})
				return
			}

			await navigate({ to: '/topics' })
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete topic'
			)
		}
	}, [deleteTopicAsync, isDeletingTopic, navigate, nodeById, topic])

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

	useEffect(() => {
		if (!topic) return

		setShouldAutoFocusRootTitle(consumeFocusNewTopicTitle(topic.id))
	}, [topic])

	useEffect(() => {
		if (!topic) return

		const previousTitle = document.title
		document.title = getTopicDocumentLabel(topic.title, topic.body)

		return () => {
			document.title = previousTitle
		}
	}, [topic])

	return {
		activeSectionId,
		collapsedSections,
		getScrollElement,
		handleDeleteTopic,
		handleGlobalFilterChange,
		handleOpenReviewCard,
		handleSectionFilterChange,
		isDeleteDialogOpen,
		isDeletingTopic,
		isDocumentLoading:
			isTopicLoading ||
			isTopicTreeLoading ||
			isSubtreeTopicsLoading ||
			isReviewCardsLoading,
		nodeById,
		registerSectionRef,
		resolvedCardTypeFilter,
		rootSection,
		scrollContainerRef,
		scrollToSection,
		sectionFilterOverrides,
		setIsDeleteDialogOpen,
		shouldAutoFocusRootTitle,
		toggleSection,
		topic,
		topicError,
		topicPath,
		topicReviewCardsById,
		ancestorIdsById
	}
}
