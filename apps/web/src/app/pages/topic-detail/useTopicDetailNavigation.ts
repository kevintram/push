import { useNavigate, useRouterState } from '@tanstack/react-router'
import type { MutableRefObject } from 'react'
import {
	startTransition,
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react'
import {
	getTopicDetailHash,
	getTopicDetailSectionId,
	parseTopicDetailHash
} from './topicDetailStructure'

type UseTopicDetailNavigationOptions = {
	rootTopicId: number
	scrollContainerRef: MutableRefObject<HTMLDivElement | null>
	scrollContainerVersion: number
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
	scrollContainerRef,
	scrollContainerVersion,
	sectionIds
}: UseTopicDetailNavigationOptions) {
	const navigate = useNavigate()
	const currentHash = useRouterState({
		select: state => state.location.hash
	})
	const currentHashValue = currentHash ? `#${currentHash}` : ''
	const sectionElementsRef = useRef(new Map<number, HTMLElement>())
	const sectionHeadingElementsRef = useRef(new Map<number, HTMLElement>())
	const intersectingSectionIdsRef = useRef(new Set<number>())
	const visibilityObserverRef = useRef<IntersectionObserver | null>(null)
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

	const syncVisibleSectionIds = useCallback(
		(nextVisibleSectionIdSet: ReadonlySet<number>) => {
			const nextVisibleSectionIds = sectionIds.filter(topicId =>
				nextVisibleSectionIdSet.has(topicId)
			)

			startTransition(() => {
				setVisibleSectionIds(previousVisibleSectionIds =>
					areSectionIdArraysEqual(
						previousVisibleSectionIds,
						nextVisibleSectionIds
					)
						? previousVisibleSectionIds
						: nextVisibleSectionIds
				)
			})
		},
		[sectionIds]
	)

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

	const measureVisibleSections = useCallback(() => {
		const scrollContainerElement = scrollContainerRef.current
		if (!scrollContainerElement) return

		const { bottom: containerBottom, top: containerTop } =
			scrollContainerElement.getBoundingClientRect()
		const nextVisibleSectionIdSet = new Set<number>()
		const sectionIdSet = new Set(sectionIds)
		const sectionHeadingElements =
			scrollContainerElement.querySelectorAll<HTMLElement>(
				'[data-topic-detail-heading-id]'
			)

		for (const sectionHeadingElement of sectionHeadingElements) {
			const topicId = Number(sectionHeadingElement.dataset.topicDetailHeadingId)
			if (!Number.isFinite(topicId) || !sectionIdSet.has(topicId)) continue

			const { bottom: sectionHeadingBottom, top: sectionHeadingTop } =
				sectionHeadingElement.getBoundingClientRect()
			const visible =
				sectionHeadingBottom > containerTop &&
				sectionHeadingTop < containerBottom

			if (visible) {
				nextVisibleSectionIdSet.add(topicId)
			}
		}

		intersectingSectionIdsRef.current = nextVisibleSectionIdSet
		syncVisibleSectionIds(nextVisibleSectionIdSet)
	}, [scrollContainerRef, sectionIds, syncVisibleSectionIds])

	const scheduleVisibleSectionsMeasurement = useCallback(() => {
		if (typeof window === 'undefined') return
		if (visibilityAnimationFrameIdRef.current != null) return

		visibilityAnimationFrameIdRef.current = window.requestAnimationFrame(() => {
			visibilityAnimationFrameIdRef.current = null
			measureVisibleSections()
		})
	}, [measureVisibleSections])

	const disconnectVisibilityObserver = useCallback(() => {
		visibilityObserverRef.current?.disconnect()
		visibilityObserverRef.current = null
	}, [])

	const handleVisibilityEntries = useCallback(
		(entries: Array<IntersectionObserverEntry>) => {
			const nextVisibleSectionIdSet = new Set(intersectingSectionIdsRef.current)
			let didChange = false

			for (const entry of entries) {
				const topicId = Number(
					(entry.target as HTMLElement).dataset.topicDetailHeadingId
				)
				if (!Number.isFinite(topicId)) continue

				if (entry.isIntersecting) {
					if (!nextVisibleSectionIdSet.has(topicId)) {
						nextVisibleSectionIdSet.add(topicId)
						didChange = true
					}
					continue
				}

				if (nextVisibleSectionIdSet.delete(topicId)) {
					didChange = true
				}
			}

			if (!didChange) return

			intersectingSectionIdsRef.current = nextVisibleSectionIdSet
			syncVisibleSectionIds(nextVisibleSectionIdSet)
		},
		[syncVisibleSectionIds]
	)

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
			const scrollContainerElement = scrollContainerRef.current
			if (!scrollContainerElement) return false

			const { top: containerTop } =
				scrollContainerElement.getBoundingClientRect()
			const { top: targetTop } = targetElement.getBoundingClientRect()
			const scrollMarginTop = Number.parseFloat(
				window.getComputedStyle(targetElement).scrollMarginTop || '0'
			)

			return Math.abs(targetTop - (containerTop + scrollMarginTop)) <= 24
		},
		[scrollContainerRef]
	)

	const scrollTargetIntoView = useCallback(
		(targetElement: HTMLElement, options?: { behavior?: ScrollBehavior }) => {
			const scrollContainerElement = scrollContainerRef.current
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
		[scrollContainerRef]
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
			measureVisibleSections()
			disconnectHashTargetObservers()
			return
		}

		fallbackScrolledHashRef.current = null
		syncHashTargetIntoView()
		measureVisibleSections()

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
		measureVisibleSections,
		syncHashTargetIntoView
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
		const scrollContainerElement = scrollContainerRef.current
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
		scrollContainerRef,
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
			measureVisibleSections()
		},
		[getTargetElement, measureVisibleSections, scrollTargetIntoView, updateHash]
	)

	const registerSectionRef = useCallback(
		(topicId: number, element: HTMLElement | null) => {
			if (element == null) {
				sectionElementsRef.current.delete(topicId)
				observeHashTargetSettledUpdates()
				return
			}

			sectionElementsRef.current.set(topicId, element)
			syncHashTargetIntoView()
			observeHashTargetSettledUpdates()
		},
		[observeHashTargetSettledUpdates, syncHashTargetIntoView]
	)

	const registerSectionHeadingRef = useCallback(
		(topicId: number, element: HTMLElement | null) => {
			if (element == null) {
				sectionHeadingElementsRef.current.delete(topicId)
			} else {
				sectionHeadingElementsRef.current.set(topicId, element)
			}

			syncHashTargetIntoView()
			observeHashTargetSettledUpdates()
		},
		[observeHashTargetSettledUpdates, syncHashTargetIntoView]
	)

	useEffect(() => {
		const scrollContainerElement = scrollContainerRef.current
		if (!scrollContainerElement) return

		intersectingSectionIdsRef.current = new Set()
		disconnectVisibilityObserver()

		if (typeof IntersectionObserver !== 'undefined') {
			const observer = new IntersectionObserver(handleVisibilityEntries, {
				root: scrollContainerElement,
				threshold: 0
			})

			visibilityObserverRef.current = observer

			const sectionHeadingElements =
				scrollContainerElement.querySelectorAll<HTMLElement>(
					'[data-topic-detail-heading-id]'
				)
			for (const sectionHeadingElement of sectionHeadingElements) {
				observer.observe(sectionHeadingElement)
			}

			measureVisibleSections()
		} else {
			measureVisibleSections()
			scrollContainerElement.addEventListener(
				'scroll',
				scheduleVisibleSectionsMeasurement,
				{
					passive: true
				}
			)
		}

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
			disconnectVisibilityObserver()
			scrollContainerElement.removeEventListener(
				'scroll',
				scheduleVisibleSectionsMeasurement
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
		disconnectVisibilityObserver,
		handleVisibilityEntries,
		measureVisibleSections,
		scheduleVisibleSectionsMeasurement,
		scrollContainerRef,
		scrollContainerVersion,
		syncVisibleSectionIds
	])

	useEffect(
		() => () => {
			if (visibilityAnimationFrameIdRef.current != null) {
				window.cancelAnimationFrame(visibilityAnimationFrameIdRef.current)
			}
			if (hashTargetAnimationFrameIdRef.current != null) {
				window.cancelAnimationFrame(hashTargetAnimationFrameIdRef.current)
			}
			disconnectVisibilityObserver()
			disconnectHashTargetObservers()
		},
		[disconnectHashTargetObservers, disconnectVisibilityObserver]
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

		measureVisibleSections()
	}, [
		completeCurrentHashAlignment,
		disconnectHashTargetObservers,
		getHashTargetTopicId,
		getTargetElement,
		isTargetAligned,
		measureVisibleSections,
		observeHashTargetSettledUpdates,
		syncHashTargetIntoView
	])

	return {
		visibleSectionIds,
		registerSectionHeadingRef,
		registerSectionRef,
		scrollToSection
	}
}
