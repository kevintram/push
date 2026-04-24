import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { useReviewCards } from '~/features/review-cards/api/getReviewCards'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopicTree } from '~/features/topics/hooks/useTopicTree'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import type { TopicDetailReviewCardFilter } from '../topic-detail/shared'
import { isTopicDetailReviewCardFilter } from '../topic-detail/shared'
import {
	buildTopicDetailSectionNumberByIdFromSections,
	buildTopicDetailSections,
	flattenTopicDetailSectionIdsFromSections,
	getTopicDetailLabel,
	groupReviewCardsByTopicId,
	TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID
} from '../topic-detail/topicDetailStructure'
import { useTopicDetailNavigation } from '../topic-detail/useTopicDetailNavigation'
import { useLibraryPageTopicCreation } from './useLibraryPageTopicCreation'

const LIBRARY_ROOT_NODE: Omit<TopicTreeNode, 'children'> = {
	id: TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID,
	title: 'Library',
	body: '',
	parent_id: null,
	parent_title: null,
	inserted_at: '',
	updated_at: ''
}

type UseLibraryPageOptions = {
	cardTypeFilter?: TopicDetailReviewCardFilter | string
	onCardTypeFilterChange: (filter: TopicDetailReviewCardFilter) => void
}

export function useLibraryPage({
	cardTypeFilter = 'all',
	onCardTypeFilterChange
}: UseLibraryPageOptions) {
	const navigate = useNavigate()
	const resolvedCardTypeFilter = isTopicDetailReviewCardFilter(cardTypeFilter)
		? cardTypeFilter
		: 'all'
	const {
		ancestorIdsById,
		error: topicTreeError,
		isLoading: isTopicTreeLoading,
		nodeById,
		roots
	} = useTopicTree()
	const {
		data: reviewCards = [],
		error: reviewCardsError,
		isLoading: isReviewCardsLoading
	} = useReviewCards({
		order: 'desc'
	})
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const [sectionFilterOverrides, setSectionFilterOverrides] = useState<
		Record<number, TopicDetailReviewCardFilter>
	>({})
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const [scrollContainerVersion, setScrollContainerVersion] = useState(0)
	const { collapsedSections, expandSection, toggleSection } =
		useSectionCollapse()

	const libraryRootNode = useMemo<TopicTreeNode>(
		() => ({
			...LIBRARY_ROOT_NODE,
			children: roots
		}),
		[roots]
	)
	const rootSections = useMemo(
		() =>
			buildTopicDetailSections(roots, {
				baseDepth: 1
			}),
		[roots]
	)
	const sectionIds = useMemo(
		() => [
			TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID,
			...flattenTopicDetailSectionIdsFromSections(rootSections)
		],
		[rootSections]
	)
	const sectionIdSet = useMemo(() => new Set(sectionIds), [sectionIds])
	const sectionNumberById = useMemo(
		() => buildTopicDetailSectionNumberByIdFromSections(rootSections),
		[rootSections]
	)
	const topicReviewCardsById = useMemo(
		() => groupReviewCardsByTopicId(reviewCards),
		[reviewCards]
	)
	const {
		preserveSectionOffset,
		registerSectionHeadingRef,
		registerSectionRef,
		scrollToSection,
		visibleSectionIds
	} = useTopicDetailNavigation({
		onNavigateToHash: (_topicId, hash, mode) =>
			navigate({
				to: '/topics',
				search: true,
				hash,
				replace: mode === 'replace',
				resetScroll: false,
				hashScrollIntoView: false
			}),
		passiveHashAlignmentEnabled: !(isTopicTreeLoading || isReviewCardsLoading),
		rootTopicId: TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID,
		scrollContainerRef,
		scrollContainerVersion,
		sectionIds
	})
	const {
		freshTopicId,
		handleCreateRootTopic,
		handleFreshTopicInteraction,
		handleSubtopicCreated,
		pendingCreatedParentTopicId,
		pendingCreatedTopicId,
		registerSectionTitleRef
	} = useLibraryPageTopicCreation({
		ancestorIdsById,
		createTopicAsync,
		expandSection,
		isCreatingTopic,
		nodeById,
		scrollToSection,
		sectionIdSet
	})

	const registerScrollContainerRef = useCallback(
		(element: HTMLDivElement | null) => {
			if (scrollContainerRef.current === element) return

			scrollContainerRef.current = element
			setScrollContainerVersion(previousVersion => previousVersion + 1)
		},
		[]
	)

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
		document.title = getTopicDetailLabel('Library')
	}, [])

	return {
		ancestorIdsById,
		collapsedSections,
		detailError: topicTreeError ?? reviewCardsError,
		freshTopicId,
		getScrollElement,
		handleCreateRootTopic,
		handleFreshTopicInteraction,
		handleGlobalFilterChange,
		handleOpenReviewCard,
		handleSectionFilterChange,
		handleSubtopicCreated,
		isCreatingTopic,
		isDetailLoading: isTopicTreeLoading,
		isReviewCardsLoading,
		libraryRootNode,
		nodeById,
		pendingCreatedParentTopicId,
		pendingCreatedTopicId,
		preserveSectionOffset,
		registerScrollContainerRef,
		registerSectionHeadingRef,
		registerSectionRef,
		registerSectionTitleRef,
		resolvedCardTypeFilter,
		rootSections,
		scrollToSection,
		sectionFilterOverrides,
		sectionNumberById,
		toggleSection,
		topicReviewCardsById,
		visibleSectionIds
	}
}
