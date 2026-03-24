import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { TopicTreeNode } from '~/features/topics/utils/topicTree'
import {
	TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX,
	TOPIC_NAVIGATOR_DRAG_SCROLL_MAX_STEP_PX
} from './TopicNavigator.shared'

type UseTopicNavigatorScrollStateOptions = {
	activeBranchIds: Array<number>
	activeDragTopicId: number | null
	activeTopicId?: number | null
	autoScrollActiveTopic: boolean
	error: unknown
	expandedIdSet: Set<number>
	isLoading: boolean
	nodeById: Map<number, TopicTreeNode>
}

export function useTopicNavigatorScrollState({
	activeBranchIds,
	activeDragTopicId,
	activeTopicId,
	autoScrollActiveTopic,
	error,
	expandedIdSet,
	isLoading,
	nodeById
}: UseTopicNavigatorScrollStateOptions) {
	const itemElementsRef = useRef(new Map<number, HTMLLIElement>())
	const scrollContainerRef = useRef<HTMLElement | null>(null)
	const activeItemScrollFrameRef = useRef<number | null>(null)
	const dragPointerPositionRef = useRef<{ x: number; y: number } | null>(null)
	const dragScrollFrameRef = useRef<number | null>(null)
	const isActiveTopicReadyToScroll = useMemo(
		() =>
			activeBranchIds.slice(0, -1).every(topicId => expandedIdSet.has(topicId)),
		[activeBranchIds, expandedIdSet]
	)

	const stopDragAutoScroll = useCallback(() => {
		if (dragScrollFrameRef.current !== null) {
			window.cancelAnimationFrame(dragScrollFrameRef.current)
			dragScrollFrameRef.current = null
		}
		dragPointerPositionRef.current = null
	}, [])

	const cancelActiveItemScroll = useCallback(() => {
		if (activeItemScrollFrameRef.current !== null) {
			window.cancelAnimationFrame(activeItemScrollFrameRef.current)
			activeItemScrollFrameRef.current = null
		}
	}, [])

	const scheduleActiveTopicScroll = useCallback(
		(topicId: number) => {
			cancelActiveItemScroll()

			activeItemScrollFrameRef.current = window.requestAnimationFrame(() => {
				activeItemScrollFrameRef.current = null

				const scrollContainer = scrollContainerRef.current
				const activeItemElement = itemElementsRef.current.get(topicId)

				if (!(scrollContainer && activeItemElement)) return

				const containerRect = scrollContainer.getBoundingClientRect()
				const activeItemRect = activeItemElement.getBoundingClientRect()
				const isAboveViewport = activeItemRect.top < containerRect.top
				const isBelowViewport = activeItemRect.bottom > containerRect.bottom

				if (!(isAboveViewport || isBelowViewport)) return

				const containerCenterY = containerRect.top + containerRect.height / 2
				const activeItemCenterY = activeItemRect.top + activeItemRect.height / 2
				const centeredScrollTop =
					scrollContainer.scrollTop + (activeItemCenterY - containerCenterY)
				const maxScrollTop = Math.max(
					0,
					scrollContainer.scrollHeight - scrollContainer.clientHeight
				)
				const nextScrollTop = Math.min(
					Math.max(0, centeredScrollTop),
					maxScrollTop
				)

				if (typeof scrollContainer.scrollTo === 'function') {
					scrollContainer.scrollTo({
						top: nextScrollTop,
						behavior: 'smooth'
					})
					return
				}

				scrollContainer.scrollTop = nextScrollTop
			})
		},
		[cancelActiveItemScroll]
	)

	useEffect(() => {
		cancelActiveItemScroll()

		if (!autoScrollActiveTopic) return
		if (activeTopicId == null || isLoading || error) return
		if (!isActiveTopicReadyToScroll) return
		if (!nodeById.has(activeTopicId)) return

		scheduleActiveTopicScroll(activeTopicId)
	}, [
		activeTopicId,
		autoScrollActiveTopic,
		cancelActiveItemScroll,
		error,
		isActiveTopicReadyToScroll,
		isLoading,
		nodeById,
		scheduleActiveTopicScroll
	])

	useEffect(() => {
		if (activeDragTopicId === null) {
			stopDragAutoScroll()
			return
		}

		const stepAutoScroll = () => {
			dragScrollFrameRef.current = window.requestAnimationFrame(stepAutoScroll)

			const scrollContainer = scrollContainerRef.current
			const pointerPosition = dragPointerPositionRef.current

			if (!(scrollContainer && pointerPosition)) return

			const containerRect = scrollContainer.getBoundingClientRect()
			if (
				pointerPosition.x < containerRect.left ||
				pointerPosition.x > containerRect.right
			) {
				return
			}

			let scrollDelta = 0

			if (
				pointerPosition.y <
				containerRect.top + TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX
			) {
				scrollDelta = -Math.ceil(
					(containerRect.top +
						TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX -
						pointerPosition.y) /
						6
				)
			} else if (
				pointerPosition.y >
				containerRect.bottom - TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX
			) {
				scrollDelta = Math.ceil(
					(pointerPosition.y -
						(containerRect.bottom -
							TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX)) /
						6
				)
			}

			if (scrollDelta === 0) return

			const clampedScrollDelta = Math.max(
				-TOPIC_NAVIGATOR_DRAG_SCROLL_MAX_STEP_PX,
				Math.min(scrollDelta, TOPIC_NAVIGATOR_DRAG_SCROLL_MAX_STEP_PX)
			)
			scrollContainer.scrollTop += clampedScrollDelta
		}

		const handlePointerMove = (event: PointerEvent) => {
			dragPointerPositionRef.current = {
				x: event.clientX,
				y: event.clientY
			}
		}

		window.addEventListener('pointermove', handlePointerMove)
		dragScrollFrameRef.current = window.requestAnimationFrame(stepAutoScroll)

		return () => {
			window.removeEventListener('pointermove', handlePointerMove)
			stopDragAutoScroll()
		}
	}, [activeDragTopicId, stopDragAutoScroll])

	useEffect(
		() => () => {
			stopDragAutoScroll()
			cancelActiveItemScroll()
		},
		[cancelActiveItemScroll, stopDragAutoScroll]
	)

	return {
		cancelActiveItemScroll,
		scrollViewportRef: (element: HTMLUListElement | null) => {
			scrollContainerRef.current =
				element?.closest('[data-slot="scroll-area-viewport"]') ??
				element?.closest('[data-slot="sidebar-content"]') ??
				null
		},
		setItemRef: (topicId: number, element: HTMLLIElement | null) => {
			if (element === null) {
				itemElementsRef.current.delete(topicId)
				return
			}

			itemElementsRef.current.set(topicId, element)
		},
		stopDragAutoScroll
	}
}
