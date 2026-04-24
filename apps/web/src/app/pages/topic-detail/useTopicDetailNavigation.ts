import { useNavigate, useRouterState } from '@tanstack/react-router'
import type { MutableRefObject } from 'react'
import {
	startTransition,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react'
import {
	getTopicDetailHash,
	getTopicDetailSectionId,
	parseTopicDetailHash
} from './topicDetailStructure'

type UseTopicDetailNavigationOptions = {
	onNavigateToHash?: (
		topicId: number,
		hash: string,
		mode: 'push' | 'replace'
	) => Promise<unknown> | void
	passiveHashAlignmentEnabled?: boolean
	rootTopicId: number
	scrollContainerRef: MutableRefObject<HTMLDivElement | null>
	scrollContainerVersion: number
	sectionIds: Array<number>
}

type HashAlignmentRequest = {
	behavior: ScrollBehavior
	hash: string
	topicId: number
}

type SectionOffsetPreservationRequest = {
	desiredOffsetTop: number
	initialDocumentTop: number
	topicId: number
}

const HASH_ALIGNMENT_RETRY_DELAYS_MS = [100, 250, 500, 900, 1400, 2200] as const
const SECTION_OFFSET_PRESERVATION_WINDOW_MS = 2500
const SECTION_OFFSET_PRESERVATION_TOLERANCE_PX = 2

function restoreInlineStyle(
	element: HTMLElement,
	property: string,
	savedValue: string | null
): void {
	if (savedValue == null) return
	if (savedValue.length === 0) {
		element.style.removeProperty(property)
	} else {
		element.style.setProperty(property, savedValue)
	}
}

function normalizeTopicDetailHash(hash: string | null | undefined): string {
	if (!hash) return ''
	return hash.startsWith('#') ? hash : `#${hash}`
}

function areSectionIdArraysEqual(
	left: Array<number>,
	right: Array<number>
): boolean {
	if (left.length !== right.length) return false

	for (let index = 0; index < left.length; index += 1) {
		if (left[index] !== right[index]) return false
	}

	return true
}

export function useTopicDetailNavigation({
	onNavigateToHash,
	passiveHashAlignmentEnabled = true,
	rootTopicId,
	scrollContainerRef,
	scrollContainerVersion,
	sectionIds
}: UseTopicDetailNavigationOptions) {
	const navigate = useNavigate()
	const routerHash = useRouterState({
		select: state => state.location.hash
	})
	const currentHashValue = normalizeTopicDetailHash(
		typeof window !== 'undefined' && window.location.hash.length > 0
			? window.location.hash
			: routerHash
	)
	const sectionIdSet = useMemo(() => new Set(sectionIds), [sectionIds])
	const sectionElementsRef = useRef(new Map<number, HTMLElement>())
	const sectionHeadingElementsRef = useRef(new Map<number, HTMLElement>())
	const intersectingSectionIdsRef = useRef(new Set<number>())
	const visibilityObserverRef = useRef<IntersectionObserver | null>(null)
	const visibilityAnimationFrameIdRef = useRef<number | null>(null)
	const hashAlignmentRequestRef = useRef<HashAlignmentRequest | null>(null)
	const hashAlignmentTimeoutIdsRef = useRef<Array<number>>([])
	const handledPassiveHashAlignmentRef = useRef<string | null>(null)
	const ignoredHashAlignmentHashRef = useRef<string | null>(null)
	const sectionOffsetPreservationRequestRef =
		useRef<SectionOffsetPreservationRequest | null>(null)
	const sectionOffsetPreservationTimeoutIdRef = useRef<number | null>(null)
	const sectionOffsetPreservationAnimationFrameIdRef = useRef<number | null>(
		null
	)
	const sectionOffsetPreservationContainerRef = useRef<HTMLDivElement | null>(
		null
	)
	const sectionOffsetPreservationOverflowAnchorRef = useRef<string | null>(null)
	const sectionOffsetPreservationScrollBehaviorRef = useRef<string | null>(null)
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
			if (currentHashValue === `#${nextHash}`) {
				return Promise.resolve()
			}

			if (onNavigateToHash) {
				return Promise.resolve(onNavigateToHash(topicId, nextHash, mode)).catch(
					() => undefined
				)
			}

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
		[currentHashValue, navigate, onNavigateToHash, rootTopicId]
	)

	const measureVisibleSections = useCallback(() => {
		const scrollContainerElement = scrollContainerRef.current
		if (!scrollContainerElement) return

		const { bottom: containerBottom, top: containerTop } =
			scrollContainerElement.getBoundingClientRect()
		const nextVisibleSectionIdSet = new Set<number>()
		const sectionHeadingElements =
			scrollContainerElement.querySelectorAll<HTMLElement>(
				'[data-topic-detail-heading-id]'
			)

		for (const sectionHeadingElement of sectionHeadingElements) {
			const topicId = Number(sectionHeadingElement.dataset.topicDetailHeadingId)
			if (!(Number.isFinite(topicId) && sectionIdSet.has(topicId))) continue

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
	}, [scrollContainerRef, sectionIdSet, sectionIds, syncVisibleSectionIds])

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

			if (
				options?.behavior === 'smooth' &&
				typeof scrollContainerElement.scrollTo === 'function'
			) {
				scrollContainerElement.scrollTo({
					top: nextScrollTop,
					behavior: 'smooth'
				})
				return
			}

			const previousInlineScrollBehavior =
				scrollContainerElement.style.scrollBehavior
			scrollContainerElement.style.scrollBehavior = 'auto'
			scrollContainerElement.scrollTop = nextScrollTop

			window.requestAnimationFrame(() => {
				scrollContainerElement.style.scrollBehavior =
					previousInlineScrollBehavior
			})
		},
		[scrollContainerRef]
	)

	const clearSectionOffsetPreservationRequest = useCallback(() => {
		sectionOffsetPreservationRequestRef.current = null

		if (
			typeof window !== 'undefined' &&
			sectionOffsetPreservationTimeoutIdRef.current != null
		) {
			window.clearTimeout(sectionOffsetPreservationTimeoutIdRef.current)
		}
		if (
			typeof window !== 'undefined' &&
			sectionOffsetPreservationAnimationFrameIdRef.current != null
		) {
			window.cancelAnimationFrame(
				sectionOffsetPreservationAnimationFrameIdRef.current
			)
		}

		const preservationContainer = sectionOffsetPreservationContainerRef.current
		if (preservationContainer) {
			restoreInlineStyle(
				preservationContainer,
				'overflow-anchor',
				sectionOffsetPreservationOverflowAnchorRef.current
			)
			restoreInlineStyle(
				preservationContainer,
				'scroll-behavior',
				sectionOffsetPreservationScrollBehaviorRef.current
			)
		}

		sectionOffsetPreservationContainerRef.current = null
		sectionOffsetPreservationOverflowAnchorRef.current = null
		sectionOffsetPreservationScrollBehaviorRef.current = null
		sectionOffsetPreservationAnimationFrameIdRef.current = null
		sectionOffsetPreservationTimeoutIdRef.current = null
	}, [])

	const preserveSectionOffset = useCallback(
		(topicId: number) => {
			if (typeof window === 'undefined') return false

			const scrollContainerElement = scrollContainerRef.current
			const targetElement = getTargetElement(topicId)

			if (!(scrollContainerElement && targetElement)) {
				clearSectionOffsetPreservationRequest()
				return false
			}

			const { top: containerTop } =
				scrollContainerElement.getBoundingClientRect()
			const { top: targetTop } = targetElement.getBoundingClientRect()
			const desiredOffsetTop = targetTop - containerTop

			clearSectionOffsetPreservationRequest()
			sectionOffsetPreservationContainerRef.current = scrollContainerElement
			sectionOffsetPreservationOverflowAnchorRef.current =
				scrollContainerElement.style.getPropertyValue('overflow-anchor')
			scrollContainerElement.style.setProperty('overflow-anchor', 'none')
			sectionOffsetPreservationRequestRef.current = {
				desiredOffsetTop,
				initialDocumentTop: scrollContainerElement.scrollTop + desiredOffsetTop,
				topicId
			}
			sectionOffsetPreservationTimeoutIdRef.current = window.setTimeout(() => {
				clearSectionOffsetPreservationRequest()
			}, SECTION_OFFSET_PRESERVATION_WINDOW_MS)

			return true
		},
		[
			clearSectionOffsetPreservationRequest,
			getTargetElement,
			scrollContainerRef
		]
	)

	const attemptSectionOffsetPreservation = useCallback(() => {
		const request = sectionOffsetPreservationRequestRef.current
		if (!request) return false

		const scrollContainerElement = scrollContainerRef.current
		if (!scrollContainerElement) return false

		if (!sectionIdSet.has(request.topicId)) {
			clearSectionOffsetPreservationRequest()
			return false
		}

		const targetElement = getTargetElement(request.topicId)
		if (!targetElement) return false

		const { top: containerTop } = scrollContainerElement.getBoundingClientRect()
		const { top: targetTop } = targetElement.getBoundingClientRect()
		const currentOffsetTop = targetTop - containerTop
		const currentDocumentTop =
			scrollContainerElement.scrollTop + currentOffsetTop
		const hasShiftedLayout =
			Math.abs(currentDocumentTop - request.initialDocumentTop) >
			SECTION_OFFSET_PRESERVATION_TOLERANCE_PX

		if (!hasShiftedLayout) {
			return false
		}

		if (
			Math.abs(currentOffsetTop - request.desiredOffsetTop) <=
			SECTION_OFFSET_PRESERVATION_TOLERANCE_PX
		) {
			return false
		}

		const nextScrollTop =
			scrollContainerElement.scrollTop +
			(currentOffsetTop - request.desiredOffsetTop)
		sectionOffsetPreservationScrollBehaviorRef.current =
			scrollContainerElement.style.scrollBehavior
		scrollContainerElement.style.scrollBehavior = 'auto'
		scrollContainerElement.scrollTop = nextScrollTop
		measureVisibleSections()
		sectionOffsetPreservationAnimationFrameIdRef.current =
			window.requestAnimationFrame(() => {
				sectionOffsetPreservationAnimationFrameIdRef.current = null
				restoreInlineStyle(
					scrollContainerElement,
					'scroll-behavior',
					sectionOffsetPreservationScrollBehaviorRef.current
				)
			})
		return true
	}, [
		clearSectionOffsetPreservationRequest,
		getTargetElement,
		measureVisibleSections,
		scrollContainerRef,
		sectionIdSet
	])

	const clearHashAlignmentTimers = useCallback(() => {
		if (typeof window === 'undefined') return

		for (const timeoutId of hashAlignmentTimeoutIdsRef.current) {
			window.clearTimeout(timeoutId)
		}
		hashAlignmentTimeoutIdsRef.current = []
	}, [])

	const clearHashAlignmentRequest = useCallback(() => {
		hashAlignmentRequestRef.current = null
		clearHashAlignmentTimers()
	}, [clearHashAlignmentTimers])

	const attemptHashAlignment = useCallback(() => {
		const request = hashAlignmentRequestRef.current
		if (!request || request.hash !== currentHashValue) return false
		if (request.behavior === 'auto' && !passiveHashAlignmentEnabled) {
			return false
		}
		if (scrollContainerRef.current == null) return false

		if (!sectionIdSet.has(request.topicId)) {
			clearHashAlignmentRequest()
			return false
		}

		const targetElement = getTargetElement(request.topicId)
		if (!targetElement) return false
		if (isTargetAligned(targetElement)) {
			handledPassiveHashAlignmentRef.current = request.hash
			if (request.behavior !== 'auto') {
				clearHashAlignmentRequest()
			}
			return false
		}

		scrollTargetIntoView(targetElement, {
			behavior: request.behavior
		})
		measureVisibleSections()

		if (request.behavior !== 'auto') {
			handledPassiveHashAlignmentRef.current = request.hash
			clearHashAlignmentRequest()
		}

		return true
	}, [
		clearHashAlignmentRequest,
		currentHashValue,
		getTargetElement,
		isTargetAligned,
		measureVisibleSections,
		scrollTargetIntoView,
		scrollContainerRef,
		sectionIdSet
	])

	const scheduleHashAlignment = useCallback(
		(hash: string, behavior: ScrollBehavior = 'auto') => {
			if (typeof window === 'undefined') return

			const topicId = parseTopicDetailHash(hash)
			if (topicId == null || !sectionIdSet.has(topicId)) {
				clearHashAlignmentRequest()
				return
			}

			clearHashAlignmentTimers()
			hashAlignmentRequestRef.current = {
				behavior,
				hash,
				topicId
			}

			hashAlignmentTimeoutIdsRef.current = HASH_ALIGNMENT_RETRY_DELAYS_MS.map(
				delay =>
					window.setTimeout(() => {
						void attemptHashAlignment()
					}, delay)
			)
			hashAlignmentTimeoutIdsRef.current.push(
				window.setTimeout(() => {
					clearHashAlignmentRequest()
				}, HASH_ALIGNMENT_RETRY_DELAYS_MS.at(-1)! + 1)
			)
		},
		[
			attemptHashAlignment,
			clearHashAlignmentRequest,
			clearHashAlignmentTimers,
			sectionIdSet
		]
	)

	const shouldAttemptHashAlignmentForTopic = useCallback(
		(topicId: number) => hashAlignmentRequestRef.current?.topicId === topicId,
		[]
	)

	const scrollToSection = useCallback(
		(
			topicId: number,
			options?: {
				behavior?: ScrollBehavior
				mode?: 'push' | 'replace'
				updateHash?: boolean
			}
		) => {
			const targetElement = getTargetElement(topicId)
			if (!targetElement || typeof window === 'undefined') return
			clearSectionOffsetPreservationRequest()

			if (options?.updateHash !== false) {
				const nextHash = getTopicDetailHash(topicId)
				ignoredHashAlignmentHashRef.current = nextHash
				clearHashAlignmentRequest()
				void updateHash(topicId, options?.mode ?? 'push')
			}
			scrollTargetIntoView(targetElement, {
				behavior: options?.behavior ?? 'smooth'
			})
			measureVisibleSections()
		},
		[
			clearHashAlignmentRequest,
			clearSectionOffsetPreservationRequest,
			getTargetElement,
			measureVisibleSections,
			scrollTargetIntoView,
			updateHash
		]
	)

	const syncHashAlignmentAfterRefChange = useCallback(
		(topicId: number, element: HTMLElement | null) => {
			if (
				element == null &&
				hashAlignmentRequestRef.current?.topicId === topicId &&
				hashAlignmentRequestRef.current.behavior !== 'auto'
			) {
				clearHashAlignmentRequest()
				return
			}

			if (!shouldAttemptHashAlignmentForTopic(topicId)) return
			const currentRequest = hashAlignmentRequestRef.current
			if (currentRequest?.behavior === 'auto') {
				scheduleHashAlignment(currentRequest.hash, currentRequest.behavior)
				return
			}
			void attemptHashAlignment()
		},
		[
			attemptHashAlignment,
			clearHashAlignmentRequest,
			scheduleHashAlignment,
			shouldAttemptHashAlignmentForTopic
		]
	)

	const syncSectionOffsetPreservationAfterRefChange = useCallback(
		(topicId: number) => {
			if (sectionOffsetPreservationRequestRef.current?.topicId !== topicId)
				return
			void attemptSectionOffsetPreservation()
		},
		[attemptSectionOffsetPreservation]
	)

	const registerSectionRef = useCallback(
		(topicId: number, element: HTMLElement | null) => {
			if (element == null) {
				sectionElementsRef.current.delete(topicId)
			} else {
				sectionElementsRef.current.set(topicId, element)
			}
			syncHashAlignmentAfterRefChange(topicId, element)
			syncSectionOffsetPreservationAfterRefChange(topicId)
		},
		[
			syncHashAlignmentAfterRefChange,
			syncSectionOffsetPreservationAfterRefChange
		]
	)

	const registerSectionHeadingRef = useCallback(
		(topicId: number, element: HTMLElement | null) => {
			if (element == null) {
				sectionHeadingElementsRef.current.delete(topicId)
			} else {
				sectionHeadingElementsRef.current.set(topicId, element)
			}
			syncHashAlignmentAfterRefChange(topicId, element)
			syncSectionOffsetPreservationAfterRefChange(topicId)
		},
		[
			syncHashAlignmentAfterRefChange,
			syncSectionOffsetPreservationAfterRefChange
		]
	)

	useEffect(() => {
		const scrollContainerElement = scrollContainerRef.current
		if (!scrollContainerElement) return

		intersectingSectionIdsRef.current = new Set()
		disconnectVisibilityObserver()

		if (typeof IntersectionObserver === 'undefined') {
			measureVisibleSections()
			scrollContainerElement.addEventListener(
				'scroll',
				scheduleVisibleSectionsMeasurement,
				{
					passive: true
				}
			)
		} else {
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
		}

		const handleUserInteraction = () => {
			if (hashAlignmentRequestRef.current != null) {
				clearHashAlignmentRequest()
			}
			if (sectionOffsetPreservationRequestRef.current != null) {
				clearSectionOffsetPreservationRequest()
			}
		}
		const handleContainerScroll = () => {
			if (sectionOffsetPreservationRequestRef.current == null) return
			void attemptSectionOffsetPreservation()
		}

		scrollContainerElement.addEventListener('scroll', handleContainerScroll, {
			passive: true
		})
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
			scrollContainerElement.removeEventListener(
				'scroll',
				handleContainerScroll
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
		clearHashAlignmentRequest,
		disconnectVisibilityObserver,
		handleVisibilityEntries,
		measureVisibleSections,
		scheduleVisibleSectionsMeasurement,
		attemptSectionOffsetPreservation,
		scrollContainerRef,
		scrollContainerVersion
	])

	useEffect(
		() => () => {
			if (visibilityAnimationFrameIdRef.current != null) {
				window.cancelAnimationFrame(visibilityAnimationFrameIdRef.current)
			}
			disconnectVisibilityObserver()
			clearHashAlignmentRequest()
			clearSectionOffsetPreservationRequest()
		},
		[
			clearHashAlignmentRequest,
			clearSectionOffsetPreservationRequest,
			disconnectVisibilityObserver
		]
	)

	useEffect(() => {
		if (currentHashValue.length === 0) {
			clearHashAlignmentRequest()
			handledPassiveHashAlignmentRef.current = null
			return
		}

		if (!passiveHashAlignmentEnabled) return

		if (ignoredHashAlignmentHashRef.current === currentHashValue) {
			ignoredHashAlignmentHashRef.current = null
			handledPassiveHashAlignmentRef.current = currentHashValue
			return
		}

		if (handledPassiveHashAlignmentRef.current === currentHashValue) return
		if (hashAlignmentRequestRef.current?.hash === currentHashValue) return

		const targetTopicId = parseTopicDetailHash(currentHashValue)
		if (targetTopicId == null || !sectionIdSet.has(targetTopicId)) return

		scheduleHashAlignment(currentHashValue)
	}, [
		clearHashAlignmentRequest,
		currentHashValue,
		passiveHashAlignmentEnabled,
		scheduleHashAlignment,
		scrollContainerVersion,
		sectionIdSet
	])

	useLayoutEffect(() => {
		void attemptSectionOffsetPreservation()
	}, [attemptSectionOffsetPreservation, scrollContainerVersion, sectionIds])

	useEffect(() => {
		void attemptHashAlignment()
		measureVisibleSections()
	}, [attemptHashAlignment, measureVisibleSections, scrollContainerVersion])

	return {
		preserveSectionOffset,
		visibleSectionIds,
		registerSectionHeadingRef,
		registerSectionRef,
		scrollToSection
	}
}
