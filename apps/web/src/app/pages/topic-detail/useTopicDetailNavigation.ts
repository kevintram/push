import { useCallback, useEffect, useRef, useState } from 'react'
import {
	getTopicDetailHash,
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
	rootTopicId: _rootTopicId,
	scrollContainerElement,
	sectionIds
}: UseTopicDetailNavigationOptions) {
	const sectionElementsRef = useRef(new Map<number, HTMLElement>())
	const sectionHeadingElementsRef = useRef(new Map<number, HTMLElement>())
	const visibilityAnimationFrameIdRef = useRef<number | null>(null)
	const visibilityTimeoutIdsRef = useRef<Array<number>>([])
	const fallbackScrolledHashRef = useRef<string | null>(null)
	const [visibleSectionIds, setVisibleSectionIds] = useState<Array<number>>([])

	const updateHash = useCallback(
		(topicId: number, mode: 'push' | 'replace' = 'push') => {
			if (typeof window === 'undefined') return

			const nextHash = getTopicDetailHash(topicId)
			if (window.location.hash === nextHash) return

			const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`
			if (mode === 'replace') {
				window.history.replaceState(window.history.state, '', nextUrl)
				return
			}

			window.history.pushState(window.history.state, '', nextUrl)
		},
		[]
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

	const getHashTargetTopicId = useCallback(() => {
		if (typeof window === 'undefined') return null

		return parseTopicDetailHash(window.location.hash)
	}, [])

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

	const syncHashTargetIntoView = useCallback(() => {
		if (typeof window === 'undefined') return false

		const hash = window.location.hash
		if (fallbackScrolledHashRef.current === hash) return false

		const targetTopicId = getHashTargetTopicId()
		if (targetTopicId == null) return false
		if (!sectionIds.includes(targetTopicId)) return false

		const targetElement = getTargetElement(targetTopicId)
		if (!targetElement) return false
		if (isTargetAligned(targetElement)) return false

		targetElement.scrollIntoView({ block: 'start' })
		fallbackScrolledHashRef.current = hash
		return true
	}, [getHashTargetTopicId, getTargetElement, isTargetAligned, sectionIds])

	const scheduleHashTargetSettledUpdates = useCallback(() => {
		if (typeof window === 'undefined') return

		for (const timeoutId of visibilityTimeoutIdsRef.current) {
			window.clearTimeout(timeoutId)
		}
		visibilityTimeoutIdsRef.current = [150, 500, 1200].map(delay =>
			window.setTimeout(() => {
				fallbackScrolledHashRef.current = null
				syncHashTargetIntoView()
				updateVisibleSections()
			}, delay)
		)
	}, [syncHashTargetIntoView, updateVisibleSections])

	const scrollToSection = useCallback(
		(
			topicId: number,
			options?: { behavior?: ScrollBehavior; mode?: 'push' | 'replace' }
		) => {
			const targetElement = getTargetElement(topicId)
			if (!targetElement || typeof window === 'undefined') return

			updateHash(topicId, options?.mode ?? 'push')
			fallbackScrolledHashRef.current = getTopicDetailHash(topicId)
			targetElement.scrollIntoView({
				behavior: options?.behavior ?? 'smooth',
				block: 'start'
			})
			scheduleVisibleSectionsUpdate()
			scheduleHashTargetSettledUpdates()
		},
		[
			getTargetElement,
			scheduleHashTargetSettledUpdates,
			scheduleVisibleSectionsUpdate,
			updateHash
		]
	)

	const registerSectionRef = useCallback(
		(topicId: number, element: HTMLElement | null) => {
			if (element == null) {
				sectionElementsRef.current.delete(topicId)
				return
			}

			sectionElementsRef.current.set(topicId, element)
		},
		[]
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
		},
		[scheduleVisibleSectionsUpdate]
	)

	useEffect(() => {
		if (!scrollContainerElement) return

		updateVisibleSections()
		scrollContainerElement.addEventListener('scroll', updateVisibleSections, {
			passive: true
		})

		return () => {
			scrollContainerElement.removeEventListener(
				'scroll',
				updateVisibleSections
			)
		}
	}, [scrollContainerElement, updateVisibleSections])

	useEffect(
		() => () => {
			if (visibilityAnimationFrameIdRef.current != null) {
				window.cancelAnimationFrame(visibilityAnimationFrameIdRef.current)
			}
			for (const timeoutId of visibilityTimeoutIdsRef.current) {
				window.clearTimeout(timeoutId)
			}
		},
		[]
	)

	useEffect(() => {
		const hasHashTarget = getHashTargetTopicId() != null

		if (syncHashTargetIntoView() || hasHashTarget) {
			scheduleHashTargetSettledUpdates()
		}

		scheduleVisibleSectionsUpdate()
	}, [
		getHashTargetTopicId,
		scheduleHashTargetSettledUpdates,
		scheduleVisibleSectionsUpdate,
		syncHashTargetIntoView
	])

	useEffect(() => {
		if (typeof window === 'undefined') return

		const handleHashChange = () => {
			fallbackScrolledHashRef.current = null
			syncHashTargetIntoView()
			updateVisibleSections()
			scheduleHashTargetSettledUpdates()
		}

		window.addEventListener('hashchange', handleHashChange)
		return () => {
			window.removeEventListener('hashchange', handleHashChange)
		}
	}, [
		scheduleHashTargetSettledUpdates,
		syncHashTargetIntoView,
		updateVisibleSections
	])

	return {
		visibleSectionIds,
		registerSectionHeadingRef,
		registerSectionRef,
		scrollToSection
	}
}
