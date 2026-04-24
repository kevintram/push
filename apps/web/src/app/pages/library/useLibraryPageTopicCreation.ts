import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import {
	getTopicDetailSectionId,
	TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID
} from '../topic-detail/topicDetailStructure'

type CreateTopicPayload = {
	body: string
	parent_id: number | null
	title: string
}

type ScrollToSectionOptions = {
	behavior?: ScrollBehavior
	mode?: 'push' | 'replace'
	updateHash?: boolean
}

type UseLibraryPageTopicCreationOptions = {
	ancestorIdsById: Map<number, Array<number>>
	createTopicAsync: (payload: CreateTopicPayload) => Promise<{ id: number }>
	expandSection: (sectionId: string) => void
	isCreatingTopic: boolean
	nodeById: Map<number, TopicTreeNode>
	scrollToSection: (topicId: number, options?: ScrollToSectionOptions) => void
	sectionIdSet: Set<number>
}

type UseLibraryPageTopicCreationResult = {
	freshTopicId: number | null
	handleCreateRootTopic: () => Promise<void>
	handleFreshTopicInteraction: (topicId: number) => void
	handleSubtopicCreated: (parentTopicId: number, createdTopicId: number) => void
	pendingCreatedParentTopicId: number | null
	pendingCreatedTopicId: number | null
	registerSectionTitleRef: (
		topicId: number,
		element: HTMLTextAreaElement | null
	) => void
}

export function useLibraryPageTopicCreation({
	ancestorIdsById,
	createTopicAsync,
	expandSection,
	isCreatingTopic,
	nodeById,
	scrollToSection,
	sectionIdSet
}: UseLibraryPageTopicCreationOptions): UseLibraryPageTopicCreationResult {
	const [pendingCreatedTopicId, setPendingCreatedTopicId] = useState<
		number | null
	>(null)
	const [freshTopicId, setFreshTopicId] = useState<number | null>(null)
	const [pendingCreatedParentTopicId, setPendingCreatedParentTopicId] =
		useState<number | null>(null)
	const sectionTitleElementsRef = useRef(new Map<number, HTMLTextAreaElement>())
	const pendingCreatedTopicIdRef = useRef<number | null>(null)

	const completePendingCreatedTopic = useCallback(
		(topicId: number, titleElement: HTMLTextAreaElement | null) => {
			if (
				titleElement == null ||
				pendingCreatedTopicIdRef.current !== topicId ||
				!sectionIdSet.has(topicId)
			) {
				return
			}

			pendingCreatedTopicIdRef.current = null

			const focusCreatedTopic = () => {
				scrollToSection(topicId, {
					behavior: 'smooth',
					mode: 'replace',
					updateHash: false
				})
				titleElement.focus({ preventScroll: true })
				titleElement.setSelectionRange(0, titleElement.value.length)
				setPendingCreatedTopicId(currentTopicId => {
					if (currentTopicId === topicId) {
						return null
					}

					return currentTopicId
				})
				setPendingCreatedParentTopicId(currentParentTopicId => {
					const parentTopicId = nodeById.get(topicId)?.parent_id ?? null
					if (
						currentParentTopicId === TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID ||
						currentParentTopicId === parentTopicId
					) {
						return null
					}

					return currentParentTopicId
				})
			}

			if (typeof window === 'undefined') {
				focusCreatedTopic()
				return
			}

			window.requestAnimationFrame(focusCreatedTopic)
		},
		[nodeById, scrollToSection, sectionIdSet]
	)
	const registerSectionTitleRef = useCallback(
		(topicId: number, element: HTMLTextAreaElement | null) => {
			if (element == null) {
				sectionTitleElementsRef.current.delete(topicId)
				return
			}

			sectionTitleElementsRef.current.set(topicId, element)
			completePendingCreatedTopic(topicId, element)
		},
		[completePendingCreatedTopic]
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
		[ancestorIdsById, expandSection]
	)
	const handleCreateRootTopic = useCallback(async () => {
		if (isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: null
			})
			pendingCreatedTopicIdRef.current = created.id
			setFreshTopicId(created.id)
			setPendingCreatedTopicId(created.id)
			setPendingCreatedParentTopicId(TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID)
		} catch {
			toast.error('Failed to create topic')
		}
	}, [createTopicAsync, isCreatingTopic])
	const handleFreshTopicInteraction = useCallback((topicId: number) => {
		setFreshTopicId(currentFreshTopicId => {
			if (currentFreshTopicId === topicId) {
				return null
			}

			return currentFreshTopicId
		})
	}, [])

	useEffect(() => {
		pendingCreatedTopicIdRef.current = pendingCreatedTopicId
	}, [pendingCreatedTopicId])

	useEffect(() => {
		if (pendingCreatedTopicId == null) return

		const titleElement =
			sectionTitleElementsRef.current.get(pendingCreatedTopicId) ?? null
		completePendingCreatedTopic(pendingCreatedTopicId, titleElement)
	}, [completePendingCreatedTopic, pendingCreatedTopicId])

	return {
		freshTopicId,
		handleCreateRootTopic,
		handleFreshTopicInteraction,
		handleSubtopicCreated,
		pendingCreatedParentTopicId,
		pendingCreatedTopicId,
		registerSectionTitleRef
	}
}
