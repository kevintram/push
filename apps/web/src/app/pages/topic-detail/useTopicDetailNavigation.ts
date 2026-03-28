import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
	getTopicDetailHash,
	getTopicDetailSectionId,
	parseTopicDetailHash
} from './topicDetailStructure'

type UseTopicDetailNavigationOptions = {
	rootTopicId: number
	scrollContainerElement: HTMLDivElement | null
	sectionIds: Array<number>
}

function areSectionIdArraysEqual(left: Array<number>, right: Array<number>) {
	if (left.length !== right.length) return false

	for (let index = 0; index < left.length; index += 1) {
		if (left[index] !== right[index]) return false
	}

	return true
}

export function useTopicDetailNavigation({
	rootTopicId,
	scrollContainerElement,
	sectionIds
}: UseTopicDetailNavigationOptions) {
	const navigate = useNavigate()
	const currentHash = useRouterState({
		select: state => state.location.hash
	})
	const currentHashValue = currentHash ? `#${currentHash}` : ''
	const sectionElementsRef = useRef(new Map<number, HTMLElement>())
	const sectionHeadingElementsRef = useRef(new Map<number, HTMLElement>())
	const visibilityAnimationFrameIdRef = useRef<number | null>(null)
	const hashTargetAnimationFrameIdRef = useRef<number | null>(null)
	const fallbackScrolledHashRef = useRef<string | null>(null)
	const pendingHashAlignmentRef = useRef<string | null>(
		currentHashValue.length > 0 ? currentHashValue : null
	)
	const lastSeenHashRef = useRef<string>(currentHashValue)
	const hashTargetMutationObserverRef = useRef<MutationObserver | null>(null)
	const hashTargetResizeObserverRef = useRef<ResizeObserver | null>(null)
	const [visibleSectionIds, setVisibleSectionIds] = useState<Array<number>>([])

	const updateHash = useCallback(
		(topicId: number, mode: 'push' | 'replace' = 'push') => {
			const nextHash = getTopicDetailSectionId(topicId)
			if (currentHash === nextHash) return Promise.resolve()

			return navigate({
				to: '/topics/$topicId',
				params: { topicId: rootTopicId.toString() },
				search: true,
				hash: nextHash,
				replace: mode === 'replace',
				resetScroll: false,
				hashScrollIntoView: false
			}).catch(() => undefined)
		},
		[currentHash, navigate, rootTopicId]
	)

	const updateVisibleSections = useCallback(() => {
		if (!scrollContainerElement) return

		const { bottom: containerBottom, top: containerTop } =
			scrollContainerElement.getBoundingClientRect()
		const nextVisibleSectionIds: Array<number> = []

		for (const topicId of sectionIds) {
			const sectionHeadingElement =
				sectionHeadingElementsRef.current.get(topicId)
			if (!sectionHeadingElement) continue

			const { bottom: sectionHeadingBottom, top: sectionHeadingTop } =
				sectionHeadingElement.getBoundingClientRect()
			const visible =
				sectionHeadingBottom > containerTop &&
				sectionHeadingTop < containerBottom

			if (visible) {
				nextVisibleSectionIds.push(topicId)
			}
		}

		setVisibleSectionIds(previousVisibleSectionIds =>
			areSectionIdArraysEqual(previousVisibleSectionIds, nextVisibleSectionIds)
				? previousVisibleSectionIds
				: nextVisibleSectionIds
		)
	}, [scrollContainerElement, sectionIds])

	const scheduleVisibleSectionsUpdate = useCallback(() => {
		if (typeof window === 'undefined') return
		if (visibilityAnimationFrameIdRef.current != null) return

		visibilityAnimationFrameIdRef.current = window.requestAnimationFrame(() => {
			visibilityAnimationFrameIdRef.current = null
			updateVisibleSections()
		})
	}, [updateVisibleSections])

	const getTargetElement = useCallback(
		(topicId: number) =>
			sectionHeadingElementsRef.current.get(topicId) ??
			sectionElementsRef.current.get(topicId) ??
			null,
		[]
	)

	const getHashTargetTopicId = useCallback(
		() => parseTopicDetailHash(currentHashValue),
		[currentHashValue]
	)

	const isTargetAligned = useCallback(
		(targetElement: HTMLElement) => {
			if (!scrollContainerElement) return false

			const { top: containerTop } =
				scrollContainerElement.getBoundingClientRect()
			const { top: targetTop } = targetElement.getBoundingClientRect()
			const scrollMarginTop = Number.parseFloat(
				window.getComputedStyle(targetElement).scrollMarginTop || '0'
			)

			return Math.abs(targetTop - (containerTop + scrollMarginTop)) <= 24
		},
		[scrollContainerElement]
	)

	const scrollTargetIntoView = useCallback(
		(targetElement: HTMLElement, options?: { behavior?: ScrollBehavior }) => {
			if (typeof window === 'undefined' || scrollContainerElement == null) {
				targetElement.scrollIntoView({
					block: 'start',
					...(options?.behavior ? { behavior: options.behavior } : {})
				})
				return
			}

			const { top: containerTop } =
				scrollContainerElement.getBoundingClientRect()
			const { top: targetTop } = targetElement.getBoundingClientRect()
			const scrollMarginTop = Number.parseFloat(
				window.getComputedStyle(targetElement).scrollMarginTop || '0'
			)
			const nextScrollTop =
				scrollContainerElement.scrollTop +
				(targetTop - containerTop) -
				scrollMarginTop

			if (options?.behavior === 'smooth') {
				scrollContainerElement.scrollTo({
					top: nextScrollTop,
					behavior: 'smooth'
				})
				return
			}

			scrollContainerElement.scrollTop = nextScrollTop
		},
		[scrollContainerElement]
	)

	const syncHashTargetIntoView = useCallback(() => {
		if (typeof window === 'undefined') return false

		if (currentHashValue.length === 0) return false
		if (pendingHashAlignmentRef.current !== currentHashValue) return false
		if (fallbackScrolledHashRef.current === currentHashValue) return false

		const targetTopicId = getHashTargetTopicId()
		if (targetTopicId == null) return false
		if (!sectionIds.includes(targetTopicId)) return false

		const targetElement = getTargetElement(targetTopicId)
		if (!targetElement) return false
		if (isTargetAligned(targetElement)) return false

		scrollTargetIntoView(targetElement)
		fallbackScrolledHashRef.current = currentHashValue
		return true
	}, [
		currentHashValue,
		getHashTargetTopicId,
		getTargetElement,
		isTargetAligned,
		scrollTargetIntoView,
		sectionIds
	])

	const disconnectHashTargetObservers = useCallback(() => {
		hashTargetMutationObserverRef.current?.disconnect()
		hashTargetMutationObserverRef.current = null
		hashTargetResizeObserverRef.current?.disconnect()
		hashTargetResizeObserverRef.current = null
	}, [])

	const cancelPendingHashAlignment = useCallback(() => {
		pendingHashAlignmentRef.current = null
		fallbackScrolledHashRef.current = null
		disconnectHashTargetObservers()
	}, [disconnectHashTargetObservers])

	const completeCurrentHashAlignment = useCallback(() => {
		if (pendingHashAlignmentRef.current === currentHashValue) {
			pendingHashAlignmentRef.current = null
		}
	}, [currentHashValue])

	const handleObservedHashTargetUpdate = useCallback(() => {
		if (
			currentHashValue.length === 0 ||
			pendingHashAlignmentRef.current !== currentHashValue
		) {
			disconnectHashTargetObservers()
			return
		}

		const targetTopicId = getHashTargetTopicId()
		if (targetTopicId == null) {
			completeCurrentHashAlignment()
			disconnectHashTargetObservers()
			return
		}

		const targetElement = getTargetElement(targetTopicId)
		if (!targetElement) {
			disconnectHashTargetObservers()
			return
		}
		if (isTargetAligned(targetElement)) {
			completeCurrentHashAlignment()
			updateVisibleSections()
			disconnectHashTargetObservers()
			return
		}

		fallbackScrolledHashRef.current = null
		syncHashTargetIntoView()
		updateVisibleSections()

		const updatedTargetElement = getTargetElement(targetTopicId)
		if (!updatedTargetElement || isTargetAligned(updatedTargetElement)) {
			completeCurrentHashAlignment()
			disconnectHashTargetObservers()
		}
	}, [
		completeCurrentHashAlignment,
		currentHashValue,
		disconnectHashTargetObservers,
		getHashTargetTopicId,
		getTargetElement,
		isTargetAligned,
		syncHashTargetIntoView,
		updateVisibleSections
	])

	const scheduleObservedHashTargetUpdate = useCallback(() => {
		if (typeof window === 'undefined') return
		if (hashTargetAnimationFrameIdRef.current != null) return

		hashTargetAnimationFrameIdRef.current = window.requestAnimationFrame(() => {
			hashTargetAnimationFrameIdRef.current = null
			handleObservedHashTargetUpdate()
		})
	}, [handleObservedHashTargetUpdate])

	const observeHashTargetSettledUpdates = useCallback(() => {
		if (
			typeof window === 'undefined' ||
			scrollContainerElement == null ||
			currentHashValue.length === 0 ||
			pendingHashAlignmentRef.current !== currentHashValue ||
			typeof MutationObserver === 'undefined'
		) {
			disconnectHashTargetObservers()
			return
		}

		const targetTopicId = getHashTargetTopicId()
		if (targetTopicId == null || !sectionIds.includes(targetTopicId)) {
			disconnectHashTargetObservers()
			return
		}

		const targetElement = getTargetElement(targetTopicId)
		if (!targetElement) {
			disconnectHashTargetObservers()
			return
		}
		if (isTargetAligned(targetElement)) {
			completeCurrentHashAlignment()
			disconnectHashTargetObservers()
			return
		}

		disconnectHashTargetObservers()
		hashTargetMutationObserverRef.current = new MutationObserver(() => {
			scheduleObservedHashTargetUpdate()
		})
		hashTargetMutationObserverRef.current.observe(scrollContainerElement, {
			subtree: true,
			childList: true,
			characterData: true,
			attributes: true
		})

		if (typeof ResizeObserver !== 'undefined') {
			hashTargetResizeObserverRef.current = new ResizeObserver(() => {
				scheduleObservedHashTargetUpdate()
			})
			hashTargetResizeObserverRef.current.observe(targetElement)
		}
	}, [
		completeCurrentHashAlignment,
		currentHashValue,
		disconnectHashTargetObservers,
		getHashTargetTopicId,
		getTargetElement,
		isTargetAligned,
		scheduleObservedHashTargetUpdate,
		scrollContainerElement,
		sectionIds
	])

	const scrollToSection = useCallback(
		(
			topicId: number,
			options?: { behavior?: ScrollBehavior; mode?: 'push' | 'replace' }
		) => {
			const targetElement = getTargetElement(topicId)
			if (!targetElement || typeof window === 'undefined') return

			const nextHash = getTopicDetailHash(topicId)
			pendingHashAlignmentRef.current = nextHash
			void updateHash(topicId, options?.mode ?? 'push')
			fallbackScrolledHashRef.current = nextHash
			scrollTargetIntoView(targetElement, {
				behavior: options?.behavior ?? 'smooth'
			})
			scheduleVisibleSectionsUpdate()
		},
		[
			getTargetElement,
			scheduleVisibleSectionsUpdate,
			scrollTargetIntoView,
			updateHash
		]
	)

	const registerSectionRef = useCallback(
		(topicId: number, element: HTMLElement | null) => {
			if (element == null) {
				sectionElementsRef.current.delete(topicId)
				observeHashTargetSettledUpdates()
				return
			}

			sectionElementsRef.current.set(topicId, element)
			observeHashTargetSettledUpdates()
		},
		[observeHashTargetSettledUpdates]
	)

	const registerSectionHeadingRef = useCallback(
		(topicId: number, element: HTMLElement | null) => {
			const previousElement = sectionHeadingElementsRef.current.get(topicId)
			if (element == null) {
				if (previousElement == null) return
				sectionHeadingElementsRef.current.delete(topicId)
			} else {
				if (previousElement === element) return
				sectionHeadingElementsRef.current.set(topicId, element)
			}

			scheduleVisibleSectionsUpdate()
			observeHashTargetSettledUpdates()
		},
		[observeHashTargetSettledUpdates, scheduleVisibleSectionsUpdate]
	)

	useEffect(() => {
		if (!scrollContainerElement) return

		updateVisibleSections()
		scrollContainerElement.addEventListener('scroll', updateVisibleSections, {
			passive: true
		})

		const handleUserInteraction = () => {
			if (pendingHashAlignmentRef.current == null) return
			cancelPendingHashAlignment()
		}

		scrollContainerElement.addEventListener('wheel', handleUserInteraction, {
			passive: true
		})
		scrollContainerElement.addEventListener(
			'touchmove',
			handleUserInteraction,
			{
				passive: true
			}
		)
		scrollContainerElement.addEventListener(
			'pointerdown',
			handleUserInteraction,
			{
				passive: true
			}
		)
		window.addEventListener('keydown', handleUserInteraction)

		return () => {
			scrollContainerElement.removeEventListener(
				'scroll',
				updateVisibleSections
			)
			scrollContainerElement.removeEventListener('wheel', handleUserInteraction)
			scrollContainerElement.removeEventListener(
				'touchmove',
				handleUserInteraction
			)
			scrollContainerElement.removeEventListener(
				'pointerdown',
				handleUserInteraction
			)
			window.removeEventListener('keydown', handleUserInteraction)
		}
	}, [
		cancelPendingHashAlignment,
		scrollContainerElement,
		updateVisibleSections
	])

	useEffect(
		() => () => {
			if (visibilityAnimationFrameIdRef.current != null) {
				window.cancelAnimationFrame(visibilityAnimationFrameIdRef.current)
			}
			if (hashTargetAnimationFrameIdRef.current != null) {
				window.cancelAnimationFrame(hashTargetAnimationFrameIdRef.current)
			}
			disconnectHashTargetObservers()
		},
		[disconnectHashTargetObservers]
	)

	useEffect(() => {
		if (lastSeenHashRef.current === currentHashValue) return

		lastSeenHashRef.current = currentHashValue
		pendingHashAlignmentRef.current =
			currentHashValue.length > 0 ? currentHashValue : null
		if (fallbackScrolledHashRef.current !== currentHashValue) {
			fallbackScrolledHashRef.current = null
		}

		if (currentHashValue.length === 0) {
			disconnectHashTargetObservers()
		}
	}, [currentHashValue, disconnectHashTargetObservers])

	useEffect(() => {
		const hasHashTarget = getHashTargetTopicId() != null

		if (syncHashTargetIntoView() || hasHashTarget) {
			observeHashTargetSettledUpdates()
		}

		const targetTopicId = getHashTargetTopicId()
		if (targetTopicId != null) {
			const targetElement = getTargetElement(targetTopicId)
			if (targetElement && isTargetAligned(targetElement)) {
				completeCurrentHashAlignment()
				disconnectHashTargetObservers()
			}
		}

		scheduleVisibleSectionsUpdate()
	}, [
		completeCurrentHashAlignment,
		disconnectHashTargetObservers,
		getHashTargetTopicId,
		getTargetElement,
		isTargetAligned,
		observeHashTargetSettledUpdates,
		scheduleVisibleSectionsUpdate,
		syncHashTargetIntoView
	])

	return {
		visibleSectionIds,
		registerSectionHeadingRef,
		registerSectionRef,
		scrollToSection
	}
}
