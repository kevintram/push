import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { useReviewCards } from '~/modules/review-cards/api/getReviewCards'
import { useCreateTopic } from '~/modules/topics/api/createTopic'
import { useDeleteTopic } from '~/modules/topics/api/deleteTopic'
import { useTopic } from '~/modules/topics/api/getTopic'
import { useTopics } from '~/modules/topics/api/getTopics'
import { useTopicTree } from '~/modules/topics/hooks/useTopicTree'

import { type TopicDetailReviewCardFilter } from './shared'
import { isTopicDetailReviewCardFilter } from './shared'
import {
	buildTopicDetailRoot,
	flattenTopicDetailSectionIds,
	getTopicDetailLabel,
	getTopicDetailSectionId,
	groupReviewCardsByTopicId,
} from './topicDetailStructure'
import { useTopicDetailNavigation } from './useTopicDetailNavigation'

type UseTopicDetailPageOptions = {
	cardTypeFilter?: TopicDetailReviewCardFilter | string
	focusTitle?: boolean
	onCardTypeFilterChange: (filter: TopicDetailReviewCardFilter) => void
	topicId: number
}

export function useTopicDetailPage({
	cardTypeFilter = 'all',
	focusTitle,
	onCardTypeFilterChange,
	topicId,
}: UseTopicDetailPageOptions) {
	const navigate = useNavigate()
	const resolvedCardTypeFilter = isTopicDetailReviewCardFilter(cardTypeFilter)
		? cardTypeFilter
		: 'all'
	const {
		data: topic,
		error: topicError,
		isLoading: isTopicLoading,
	} = useTopic(topicId)
	const {
		ancestorIdsById,
		error: topicTreeError,
		isLoading: isTopicTreeLoading,
		nodeById,
	} = useTopicTree()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const {
		data: subtreeTopics = [],
		error: subtreeTopicsError,
		isLoading: isSubtreeTopicsLoading,
	} = useTopics({
		subtree_of: topicId,
		sort: 'title',
		order: 'asc',
	})
	const {
		data: reviewCards = [],
		error: reviewCardsError,
		isLoading: isReviewCardsLoading,
	} = useReviewCards({
		topic_id: topicId,
		include_descendants: true,
	})
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const shouldAutoFocusRootTitle = focusTitle ?? false
	const [pendingCreatedTopicId, setPendingCreatedTopicId] = useState<
		number | null
	>(null)
	const [freshTopicId, setFreshTopicId] = useState<number | null>(null)
	const [pendingCreatedParentTopicId, setPendingCreatedParentTopicId] =
		useState<number | null>(null)
	const [sectionFilterOverrides, setSectionFilterOverrides] = useState<
		Record<number, TopicDetailReviewCardFilter>
	>({})
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const sectionTitleElementsRef = useRef(
		new Map<number, HTMLTextAreaElement>(),
	)
	const pendingCreatedTopicIdRef = useRef<number | null>(null)
	const [scrollContainerVersion, setScrollContainerVersion] = useState(0)
	const { collapsedSections, expandSection, toggleSection } =
		useSectionCollapse()

	const subtreeTopicsWithRoot = useMemo(() => {
		if (!topic) return subtreeTopics
		if (subtreeTopics.some(subtreeTopic => subtreeTopic.id === topic.id)) {
			return subtreeTopics
		}

		return [topic, ...subtreeTopics]
	}, [subtreeTopics, topic])

	const rootSection = useMemo(
		() => buildTopicDetailRoot(subtreeTopicsWithRoot, topicId),
		[subtreeTopicsWithRoot, topicId],
	)
	const sectionIds = useMemo(
		() => flattenTopicDetailSectionIds(rootSection),
		[rootSection],
	)
	const isPassiveHashAlignmentEnabled = !(
		isTopicLoading ||
		isTopicTreeLoading ||
		isSubtreeTopicsLoading ||
		isReviewCardsLoading
	)
	const topicReviewCardsById = useMemo(
		() => groupReviewCardsByTopicId(reviewCards),
		[reviewCards],
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
	const {
		preserveSectionOffset,
		registerSectionHeadingRef,
		registerSectionRef,
		scrollToSection,
		visibleSectionIds,
	} = useTopicDetailNavigation({
		passiveHashAlignmentEnabled: isPassiveHashAlignmentEnabled,
		rootTopicId: topicId,
		scrollContainerRef,
		scrollContainerVersion,
		sectionIds,
	})

	const registerScrollContainerRef = useCallback(
		(element: HTMLDivElement | null) => {
			if (scrollContainerRef.current === element) return

			scrollContainerRef.current = element
			setScrollContainerVersion(previousVersion => previousVersion + 1)
		},
		[],
	)

	const getScrollElement = useCallback(() => scrollContainerRef.current, [])
	const completePendingCreatedTopic = useCallback(
		(topicId: number, titleElement: HTMLTextAreaElement | null) => {
			if (
				titleElement == null ||
				pendingCreatedTopicIdRef.current !== topicId ||
				!sectionIds.includes(topicId)
			) {
				return
			}

			pendingCreatedTopicIdRef.current = null

			const focusCreatedTopic = () => {
				scrollToSection(topicId, {
					behavior: 'smooth',
					mode: 'replace',
					updateHash: false,
				})
				titleElement.focus({ preventScroll: true })
				titleElement.setSelectionRange(0, titleElement.value.length)
				setPendingCreatedTopicId(currentTopicId =>
					currentTopicId === topicId ? null : currentTopicId,
				)
				setPendingCreatedParentTopicId(currentParentTopicId =>
					currentParentTopicId === nodeById.get(topicId)?.parentId
						? null
						: currentParentTopicId,
				)
			}

			if (typeof window === 'undefined') {
				focusCreatedTopic()
				return
			}

			window.requestAnimationFrame(focusCreatedTopic)
		},
		[nodeById, scrollToSection, sectionIds],
	)
	const detailError =
		topicError ?? topicTreeError ?? subtreeTopicsError ?? reviewCardsError

	const registerSectionTitleRef = useCallback(
		(topicId: number, element: HTMLTextAreaElement | null) => {
			if (element == null) {
				sectionTitleElementsRef.current.delete(topicId)
				return
			}

			sectionTitleElementsRef.current.set(topicId, element)
			completePendingCreatedTopic(topicId, element)
		},
		[completePendingCreatedTopic],
	)

	const handleGlobalFilterChange = useCallback(
		(filter: TopicDetailReviewCardFilter) => {
			setSectionFilterOverrides({})
			onCardTypeFilterChange(filter)
		},
		[onCardTypeFilterChange],
	)

	const handleSectionFilterChange = useCallback(
		(topicFilterId: number, filter: TopicDetailReviewCardFilter) => {
			setSectionFilterOverrides(previousOverrides => {
				if (filter === resolvedCardTypeFilter) {
					const {
						[topicFilterId]: _removedOverride,
						...remainingOverrides
					} = previousOverrides
					return remainingOverrides
				}

				return {
					...previousOverrides,
					[topicFilterId]: filter,
				}
			})
		},
		[resolvedCardTypeFilter],
	)

	const handleSubtopicCreated = useCallback(
		(parentTopicId: number, createdTopicId: number) => {
			const ancestorIds = ancestorIdsById.get(parentTopicId) ?? []
			for (const topicIdToExpand of [...ancestorIds, parentTopicId]) {
				expandSection(getTopicDetailSectionId(topicIdToExpand))
			}

			pendingCreatedTopicIdRef.current = createdTopicId
			setFreshTopicId(createdTopicId)
			setPendingCreatedTopicId(createdTopicId)
			setPendingCreatedParentTopicId(parentTopicId)
		},
		[ancestorIdsById, expandSection],
	)

	const handleFreshTopicInteraction = useCallback(
		(topicId: number) => {
			if (freshTopicId !== topicId) return
			setFreshTopicId(null)
		},
		[freshTopicId],
	)

	const handleCreateSubtopic = useCallback(async () => {
		if (!topic || isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parentId: topic.id,
			})
			handleSubtopicCreated(topic.id, created.id)
		} catch {
			toast.error('Failed to create topic')
		}
	}, [createTopicAsync, handleSubtopicCreated, isCreatingTopic, topic])

	const handleDeleteTopic = useCallback(async () => {
		if (!topic || isDeletingTopic) return

		try {
			await deleteTopicAsync(topic.id)
			setIsDeleteDialogOpen(false)
			toast.success('Topic deleted')

			if (topic.parentId != null && nodeById.has(topic.parentId)) {
				await navigate({
					to: '/topics/$topicId',
					params: { topicId: topic.parentId.toString() },
				})
				return
			}

			await navigate({ to: '/library' })
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to delete topic',
			)
		}
	}, [deleteTopicAsync, isDeletingTopic, navigate, nodeById, topic])

	const handleOpenReviewCard = useCallback(
		(reviewCardId: number) => {
			navigate({
				to: '/review-cards/$reviewCardId',
				params: { reviewCardId: reviewCardId.toString() },
				search: { tab: 'home' },
			})
		},
		[navigate],
	)

	useEffect(() => {
		if (!topic) return

		const previousTitle = document.title
		document.title = getTopicDetailLabel(topic.title, topic.body)

		return () => {
			document.title = previousTitle
		}
	}, [topic])

	useEffect(() => {
		pendingCreatedTopicIdRef.current = pendingCreatedTopicId
	}, [pendingCreatedTopicId])

	useEffect(() => {
		if (pendingCreatedTopicId == null) return

		const titleElement =
			sectionTitleElementsRef.current.get(pendingCreatedTopicId) ?? null
		completePendingCreatedTopic(pendingCreatedTopicId, titleElement)
	}, [completePendingCreatedTopic, pendingCreatedTopicId, sectionIds])

	return {
		collapsedSections,
		getScrollElement,
		handleCreateSubtopic,
		handleDeleteTopic,
		handleGlobalFilterChange,
		handleOpenReviewCard,
		handleSectionFilterChange,
		handleSubtopicCreated,
		isDeleteDialogOpen,
		isDeletingTopic,
		isDetailLoading:
			isTopicLoading || isTopicTreeLoading || isSubtreeTopicsLoading,
		isCreatingTopic,
		isReviewCardsLoading,
		nodeById,
		freshTopicId,
		pendingCreatedTopicId,
		pendingCreatedParentTopicId,
		handleFreshTopicInteraction,
		registerSectionHeadingRef,
		registerSectionRef,
		registerSectionTitleRef,
		preserveSectionOffset,
		scrollToSection,
		registerScrollContainerRef,
		resolvedCardTypeFilter,
		rootSection,
		sectionFilterOverrides,
		setIsDeleteDialogOpen,
		shouldAutoFocusRootTitle,
		toggleSection,
		detailError,
		topic,
		topicPath,
		topicReviewCardsById,
		ancestorIdsById,
		visibleSectionIds,
	}
}
