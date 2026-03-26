import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import {
	getTopicDocumentHash,
	parseTopicDocumentHash
} from './topicDocumentUtils'

type UseTopicDocumentNavigationOptions = {
	rootTopicId: number
	scrollContainerRef: RefObject<HTMLDivElement | null>
	sectionIds: Array<number>
}

const ACTIVE_SECTION_TOP_OFFSET_PX = 120

export function useTopicDocumentNavigation({
	rootTopicId,
	scrollContainerRef,
	sectionIds
}: UseTopicDocumentNavigationOptions) {
	const sectionElementsRef = useRef(new Map<number, HTMLElement>())
	const scrollFrameRef = useRef<number | null>(null)
	const [activeSectionId, setActiveSectionId] = useState(rootTopicId)

	const updateHash = useCallback(
		(topicId: number, mode: 'push' | 'replace' = 'push') => {
			if (typeof window === 'undefined') return

			const nextHash = getTopicDocumentHash(topicId)
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

	const scrollToHashTopic = useCallback(
		(topicId: number) => {
			if (typeof window === 'undefined') return
			if (!sectionIds.includes(topicId)) return

			const sectionElement = sectionElementsRef.current.get(topicId)
			if (!sectionElement) return

			sectionElement.scrollIntoView({
				behavior: 'auto',
				block: 'start'
			})
			setActiveSectionId(topicId)
		},
		[sectionIds]
	)

	const scrollToSection = useCallback(
		(
			topicId: number,
			options?: { behavior?: ScrollBehavior; mode?: 'push' | 'replace' }
		) => {
			const sectionElement = sectionElementsRef.current.get(topicId)
			if (!sectionElement || typeof window === 'undefined') return

			const mode = options?.mode ?? 'push'
			updateHash(topicId, mode)

			sectionElement.scrollIntoView({
				behavior: options?.behavior ?? 'smooth',
				block: 'start'
			})
			setActiveSectionId(topicId)
		},
		[updateHash]
	)

	const updateActiveSection = useCallback(() => {
		const scrollContainer = scrollContainerRef.current
		if (!scrollContainer) return

		const containerTop =
			scrollContainer.getBoundingClientRect().top + ACTIVE_SECTION_TOP_OFFSET_PX
		let bestVisibleTopicId = rootTopicId
		let bestVisibleTop = Number.NEGATIVE_INFINITY
		let nearestBelowTopicId = rootTopicId
		let nearestBelowTop = Number.POSITIVE_INFINITY

		for (const topicId of sectionIds) {
			const sectionElement = sectionElementsRef.current.get(topicId)
			if (!sectionElement) continue

			const sectionTop =
				sectionElement.getBoundingClientRect().top - containerTop

			if (sectionTop <= 0 && sectionTop > bestVisibleTop) {
				bestVisibleTop = sectionTop
				bestVisibleTopicId = topicId
				continue
			}

			if (sectionTop > 0 && sectionTop < nearestBelowTop) {
				nearestBelowTop = sectionTop
				nearestBelowTopicId = topicId
			}
		}

		setActiveSectionId(
			bestVisibleTop === Number.NEGATIVE_INFINITY
				? nearestBelowTopicId
				: bestVisibleTopicId
		)
	}, [rootTopicId, scrollContainerRef, sectionIds])

	const scheduleActiveSectionUpdate = useCallback(() => {
		if (scrollFrameRef.current != null) return

		scrollFrameRef.current = window.requestAnimationFrame(() => {
			scrollFrameRef.current = null
			updateActiveSection()
		})
	}, [updateActiveSection])

	useEffect(() => {
		setActiveSectionId(rootTopicId)
	}, [rootTopicId])

	useEffect(() => {
		const scrollContainer = scrollContainerRef.current
		if (!scrollContainer) return

		updateActiveSection()
		scrollContainer.addEventListener('scroll', scheduleActiveSectionUpdate, {
			passive: true
		})

		return () => {
			scrollContainer.removeEventListener('scroll', scheduleActiveSectionUpdate)
		}
	}, [scheduleActiveSectionUpdate, scrollContainerRef, updateActiveSection])

	useEffect(() => {
		const targetTopicId = parseTopicDocumentHash(window.location.hash)
		if (targetTopicId == null) {
			setActiveSectionId(rootTopicId)
			return
		}

		scrollToHashTopic(targetTopicId)
	}, [rootTopicId, scrollToHashTopic])

	useEffect(() => {
		const handleHashChange = () => {
			const targetTopicId = parseTopicDocumentHash(window.location.hash)
			if (targetTopicId == null) {
				updateActiveSection()
				return
			}

			scrollToHashTopic(targetTopicId)
		}

		window.addEventListener('hashchange', handleHashChange)
		return () => {
			window.removeEventListener('hashchange', handleHashChange)
		}
	}, [scrollToHashTopic, updateActiveSection])

	useEffect(
		() => () => {
			if (scrollFrameRef.current != null) {
				window.cancelAnimationFrame(scrollFrameRef.current)
			}
		},
		[]
	)

	return {
		activeSectionId,
		registerSectionRef: (topicId: number, element: HTMLElement | null) => {
			if (element == null) {
				sectionElementsRef.current.delete(topicId)
				return
			}

			sectionElementsRef.current.set(topicId, element)
		},
		scrollToSection
	}
}
