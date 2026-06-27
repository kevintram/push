import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()
let currentHash = ''

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => navigateMock,
	useRouterState: ({
		select,
	}: {
		select: (state: { location: { hash: string } }) => unknown
	}) => select({ location: { hash: currentHash } }),
}))

import { useTopicDetailNavigation } from '../useTopicDetailNavigation'

function createDomRect(top: number, height = 40): DOMRect {
	return {
		bottom: top + height,
		height,
		left: 0,
		right: 0,
		toJSON: () => ({}),
		top,
		width: 0,
		x: 0,
		y: top,
	} as DOMRect
}

function attachScrollToSpy(element: HTMLDivElement) {
	const scrollTo = vi.fn(
		(options?: ScrollToOptions | number, _y?: number) => {
			if (typeof options === 'number') {
				element.scrollTop = options
				return
			}

			element.scrollTop = options?.top ?? element.scrollTop
		},
	)

	Object.defineProperty(element, 'scrollTo', {
		value: scrollTo,
		configurable: true,
	})

	return scrollTo
}

function createNavigationOptions({
	passiveHashAlignmentEnabled = true,
	rootTopicId = 1,
	scrollContainerElement,
	scrollContainerVersion = scrollContainerElement ? 1 : 0,
	sectionIds,
}: {
	passiveHashAlignmentEnabled?: boolean
	rootTopicId?: number
	scrollContainerElement: HTMLDivElement | null
	scrollContainerVersion?: number
	sectionIds: Array<number>
}) {
	return {
		passiveHashAlignmentEnabled,
		rootTopicId,
		scrollContainerRef: {
			current: scrollContainerElement,
		},
		scrollContainerVersion,
		sectionIds,
	}
}

function mockRectFromScrollPosition(
	element: HTMLElement,
	scrollContainer: HTMLDivElement,
	documentTop: number,
	height = 60,
) {
	return vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => {
		const containerTop = scrollContainer.getBoundingClientRect().top
		return createDomRect(
			documentTop - scrollContainer.scrollTop + containerTop,
			height,
		)
	})
}

describe('useTopicDetailNavigation', () => {
	const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
	const originalRequestAnimationFrame = window.requestAnimationFrame
	const originalCancelAnimationFrame = window.cancelAnimationFrame
	const originalIntersectionObserver = globalThis.IntersectionObserver
	let pendingAnimationFrames: Array<FrameRequestCallback>

	function flushAnimationFrames(...timestamps: Array<number>) {
		const frameTimestamps = timestamps.length > 0 ? timestamps : [0]

		for (const timestamp of frameTimestamps) {
			const callbacks = [...pendingAnimationFrames]
			pendingAnimationFrames = []
			callbacks.forEach(callback => {
				callback(timestamp)
			})
		}
	}

	beforeEach(() => {
		vi.useFakeTimers()
		currentHash = ''
		navigateMock.mockReset()
		navigateMock.mockImplementation(async options => {
			if (typeof options.hash === 'string') {
				currentHash = options.hash
			}
		})
		pendingAnimationFrames = []
		window.requestAnimationFrame = vi.fn(callback => {
			pendingAnimationFrames.push(callback)
			return pendingAnimationFrames.length
		})
		window.cancelAnimationFrame = vi.fn()
		globalThis.IntersectionObserver = undefined as never
	})

	afterEach(() => {
		vi.useRealTimers()
		HTMLElement.prototype.scrollIntoView = originalScrollIntoView
		window.requestAnimationFrame = originalRequestAnimationFrame
		window.cancelAnimationFrame = originalCancelAnimationFrame
		globalThis.IntersectionObserver = originalIntersectionObserver
		document.body.innerHTML = ''
	})

	it('updates the router hash when scrolling to a section and keeps visible heading tracking local', async () => {
		const scrollContainer = document.createElement('div')
		const scrollContainerScrollTo = attachScrollToSpy(scrollContainer)
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		const sectionThree = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo, sectionThree)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'
		sectionThree.dataset.topicDetailHeadingId = '3'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		const sectionOneRect = vi
			.spyOn(sectionOne, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(20, 60))
		const sectionTwoRect = vi
			.spyOn(sectionTwo, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(130, 60))
		vi.spyOn(sectionThree, 'getBoundingClientRect').mockReturnValue(
			createDomRect(260, 60),
		)

		const { result, rerender } = renderHook(() =>
			useTopicDetailNavigation(
				createNavigationOptions({
					rootTopicId: 1,
					scrollContainerElement: scrollContainer,
					sectionIds: [1, 2, 3],
				}),
			),
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionRef(3, sectionThree)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(3, sectionThree)
			flushAnimationFrames()
		})

		act(() => {
			scrollContainer.dispatchEvent(new Event('scroll'))
			flushAnimationFrames()
		})

		expect(result.current.visibleSectionIds).toEqual([1, 2])

		await act(async () => {
			result.current.scrollToSection(3, {
				behavior: 'auto',
			})
			flushAnimationFrames()
		})

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '1' },
			search: true,
			hash: 'topic-3',
			replace: false,
			resetScroll: false,
			hashScrollIntoView: false,
		})
		expect(scrollContainer.scrollTop).toBe(260)
		expect(scrollContainerScrollTo).not.toHaveBeenCalled()

		sectionOneRect.mockReturnValue(createDomRect(-240, 60))
		sectionTwoRect.mockReturnValue(createDomRect(-130, 60))

		await act(async () => {
			result.current.scrollToSection(2, {
				mode: 'replace',
			})
			flushAnimationFrames()
			rerender()
		})

		expect(navigateMock).toHaveBeenLastCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '1' },
			search: true,
			hash: 'topic-2',
			replace: true,
			resetScroll: false,
			hashScrollIntoView: false,
		})
		expect(scrollContainerScrollTo).toHaveBeenCalledTimes(1)
		expect(scrollContainerScrollTo).toHaveBeenCalledWith({
			top: 130,
			behavior: 'smooth',
		})

		sectionOneRect.mockReturnValue(createDomRect(-80, 60))
		sectionTwoRect.mockReturnValue(createDomRect(20, 60))

		act(() => {
			scrollContainer.dispatchEvent(new Event('scroll'))
			flushAnimationFrames()
		})

		expect(result.current.visibleSectionIds).toEqual([2])
	})

	it('starts tracking scroll after the scroll container mounts', () => {
		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		const sectionOneRect = vi
			.spyOn(sectionOne, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(20, 60))
		const sectionTwoRect = vi
			.spyOn(sectionTwo, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(130, 60))

		const { result, rerender } = renderHook<
			ReturnType<typeof useTopicDetailNavigation>,
			{
				scrollContainerElement: HTMLDivElement | null
				scrollContainerVersion: number
			}
		>(
			({ scrollContainerElement, scrollContainerVersion }) =>
				useTopicDetailNavigation(
					createNavigationOptions({
						rootTopicId: 1,
						scrollContainerElement,
						scrollContainerVersion,
						sectionIds: [1, 2],
					}),
				),
			{
				initialProps: {
					scrollContainerElement: null,
					scrollContainerVersion: 0,
				},
			},
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			flushAnimationFrames()
		})

		expect(result.current.visibleSectionIds).toEqual([])

		act(() => {
			rerender({
				scrollContainerElement: scrollContainer,
				scrollContainerVersion: 1,
			})
			flushAnimationFrames()
		})

		expect(result.current.visibleSectionIds).toEqual([1, 2])

		sectionOneRect.mockReturnValue(createDomRect(-80, 60))
		sectionTwoRect.mockReturnValue(createDomRect(20, 60))

		act(() => {
			scrollContainer.dispatchEvent(new Event('scroll'))
			flushAnimationFrames()
		})

		expect(result.current.visibleSectionIds).toEqual([2])
	})

	it('preserves a section visual offset after the section order changes', () => {
		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		let sectionTwoDocumentTop = 320

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'
		scrollContainer.scrollTop = 250

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		vi.spyOn(sectionTwo, 'getBoundingClientRect').mockImplementation(() => {
			const containerTop = scrollContainer.getBoundingClientRect().top
			return createDomRect(
				sectionTwoDocumentTop -
					scrollContainer.scrollTop +
					containerTop,
				60,
			)
		})

		const { result, rerender } = renderHook<
			ReturnType<typeof useTopicDetailNavigation>,
			{ sectionIds: Array<number> }
		>(
			({ sectionIds }) =>
				useTopicDetailNavigation(
					createNavigationOptions({
						rootTopicId: 1,
						scrollContainerElement: scrollContainer,
						sectionIds,
					}),
				),
			{
				initialProps: {
					sectionIds: [1, 2],
				},
			},
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			result.current.preserveSectionOffset(2)
		})

		expect(scrollContainer.scrollTop).toBe(250)
		expect(scrollContainer.style.getPropertyValue('overflow-anchor')).toBe(
			'none',
		)

		act(() => {
			sectionTwoDocumentTop = 120
			rerender({
				sectionIds: [2, 1],
			})
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(50)
		expect(scrollContainer.style.getPropertyValue('overflow-anchor')).toBe(
			'none',
		)

		act(() => {
			vi.runAllTimers()
		})

		expect(scrollContainer.style.getPropertyValue('overflow-anchor')).toBe(
			'',
		)
	})

	it('cancels pending section offset preservation when the user scrolls', () => {
		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		let sectionTwoDocumentTop = 320

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'
		scrollContainer.scrollTop = 250

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		vi.spyOn(sectionTwo, 'getBoundingClientRect').mockImplementation(() => {
			const containerTop = scrollContainer.getBoundingClientRect().top
			return createDomRect(
				sectionTwoDocumentTop -
					scrollContainer.scrollTop +
					containerTop,
				60,
			)
		})

		const { result, rerender } = renderHook<
			ReturnType<typeof useTopicDetailNavigation>,
			{ sectionIds: Array<number> }
		>(
			({ sectionIds }) =>
				useTopicDetailNavigation(
					createNavigationOptions({
						rootTopicId: 1,
						scrollContainerElement: scrollContainer,
						sectionIds,
					}),
				),
			{
				initialProps: {
					sectionIds: [1, 2],
				},
			},
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			result.current.preserveSectionOffset(2)
		})

		expect(scrollContainer.style.getPropertyValue('overflow-anchor')).toBe(
			'none',
		)

		scrollContainer.scrollTop = 100

		act(() => {
			scrollContainer.dispatchEvent(new Event('wheel'))
		})

		act(() => {
			sectionTwoDocumentTop = 120
			rerender({
				sectionIds: [2, 1],
			})
			flushAnimationFrames()
			vi.runAllTimers()
		})

		expect(scrollContainer.scrollTop).toBe(100)
		expect(scrollContainer.style.getPropertyValue('overflow-anchor')).toBe(
			'',
		)
	})

	it('reapplies the preserved section offset after a later native scroll adjustment', () => {
		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		let sectionTwoDocumentTop = 320

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'
		scrollContainer.scrollTop = 250

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		vi.spyOn(sectionTwo, 'getBoundingClientRect').mockImplementation(() => {
			const containerTop = scrollContainer.getBoundingClientRect().top
			return createDomRect(
				sectionTwoDocumentTop -
					scrollContainer.scrollTop +
					containerTop,
				60,
			)
		})

		const { result, rerender } = renderHook<
			ReturnType<typeof useTopicDetailNavigation>,
			{ sectionIds: Array<number> }
		>(
			({ sectionIds }) =>
				useTopicDetailNavigation(
					createNavigationOptions({
						rootTopicId: 1,
						scrollContainerElement: scrollContainer,
						sectionIds,
					}),
				),
			{
				initialProps: {
					sectionIds: [1, 2],
				},
			},
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			result.current.preserveSectionOffset(2)
		})

		act(() => {
			sectionTwoDocumentTop = 120
			rerender({
				sectionIds: [2, 1],
			})
		})

		expect(scrollContainer.scrollTop).toBe(50)

		scrollContainer.scrollTop = 250

		act(() => {
			scrollContainer.dispatchEvent(new Event('scroll'))
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(50)
		expect(scrollContainer.style.getPropertyValue('overflow-anchor')).toBe(
			'none',
		)

		act(() => {
			vi.runAllTimers()
		})

		expect(scrollContainer.style.getPropertyValue('overflow-anchor')).toBe(
			'',
		)
	})

	it('cancels pending section offset preservation when navigating to another section', () => {
		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		let sectionTwoDocumentTop = 320

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'
		scrollContainer.scrollTop = 250

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		vi.spyOn(sectionTwo, 'getBoundingClientRect').mockImplementation(() => {
			const containerTop = scrollContainer.getBoundingClientRect().top
			return createDomRect(
				sectionTwoDocumentTop -
					scrollContainer.scrollTop +
					containerTop,
				60,
			)
		})

		const { result } = renderHook(() =>
			useTopicDetailNavigation(
				createNavigationOptions({
					rootTopicId: 1,
					scrollContainerElement: scrollContainer,
					sectionIds: [1, 2],
				}),
			),
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			result.current.preserveSectionOffset(2)
		})

		sectionTwoDocumentTop = 120

		act(() => {
			result.current.scrollToSection(1, {
				behavior: 'auto',
				updateHash: false,
			})
		})

		expect(scrollContainer.scrollTop).toBe(20)
		expect(scrollContainer.style.getPropertyValue('overflow-anchor')).toBe(
			'',
		)

		scrollContainer.scrollTop = 250

		act(() => {
			scrollContainer.dispatchEvent(new Event('scroll'))
			flushAnimationFrames()
			vi.runAllTimers()
		})

		expect(scrollContainer.scrollTop).toBe(250)
	})

	it('aligns a deep link after section ids and refs arrive asynchronously', () => {
		currentHash = 'topic-2'

		const scrollContainer = document.createElement('div')
		attachScrollToSpy(scrollContainer)
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		mockRectFromScrollPosition(sectionTwo, scrollContainer, 320)

		const { result, rerender } = renderHook<
			ReturnType<typeof useTopicDetailNavigation>,
			{ sectionIds: Array<number> }
		>(
			({ sectionIds }) =>
				useTopicDetailNavigation(
					createNavigationOptions({
						rootTopicId: 1,
						scrollContainerElement: scrollContainer,
						sectionIds,
					}),
				),
			{
				initialProps: {
					sectionIds: [],
				},
			},
		)

		expect(scrollContainer.scrollTop).toBe(0)

		act(() => {
			rerender({
				sectionIds: [1, 2],
			})
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			flushAnimationFrames()
			vi.runAllTimers()
		})

		expect(scrollContainer.scrollTop).toBe(320)
	})

	it('does not re-align a pending deep link when unrelated sections register', () => {
		currentHash = 'topic-2'

		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		const sectionThree = document.createElement('section')
		let sectionTwoDocumentTop = 185

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo, sectionThree)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'
		sectionThree.dataset.topicDetailHeadingId = '3'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		vi.spyOn(sectionTwo, 'getBoundingClientRect').mockImplementation(() => {
			const containerTop = scrollContainer.getBoundingClientRect().top
			return createDomRect(
				sectionTwoDocumentTop -
					scrollContainer.scrollTop +
					containerTop,
				60,
			)
		})
		mockRectFromScrollPosition(sectionThree, scrollContainer, 420)

		const { result } = renderHook(() =>
			useTopicDetailNavigation(
				createNavigationOptions({
					rootTopicId: 1,
					scrollContainerElement: scrollContainer,
					sectionIds: [1, 2, 3],
				}),
			),
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			vi.advanceTimersByTime(100)
		})

		expect(scrollContainer.scrollTop).toBe(185)

		act(() => {
			sectionTwoDocumentTop = 320
			result.current.registerSectionRef(3, sectionThree)
			result.current.registerSectionHeadingRef(3, sectionThree)
		})

		expect(scrollContainer.scrollTop).toBe(185)
	})

	it('keeps a passive deep-link request alive through transient alignment', () => {
		currentHash = 'topic-2'

		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		let sectionTwoDocumentTop = 0

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		vi.spyOn(sectionTwo, 'getBoundingClientRect').mockImplementation(() => {
			const containerTop = scrollContainer.getBoundingClientRect().top
			return createDomRect(
				sectionTwoDocumentTop -
					scrollContainer.scrollTop +
					containerTop,
				60,
			)
		})

		const { result } = renderHook(() =>
			useTopicDetailNavigation(
				createNavigationOptions({
					rootTopicId: 1,
					scrollContainerElement: scrollContainer,
					sectionIds: [1, 2],
				}),
			),
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(2, sectionTwo)
		})

		expect(scrollContainer.scrollTop).toBe(0)

		act(() => {
			sectionTwoDocumentTop = 320
			result.current.registerSectionHeadingRef(2, null)
			result.current.registerSectionRef(2, null)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			result.current.registerSectionRef(2, sectionTwo)
			vi.advanceTimersByTime(250)
		})

		expect(scrollContainer.scrollTop).toBe(320)
	})

	it('waits until passive hash alignment is enabled before scrolling a deep link', () => {
		currentHash = 'topic-2'

		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		mockRectFromScrollPosition(sectionTwo, scrollContainer, 320)

		const { result, rerender } = renderHook<
			ReturnType<typeof useTopicDetailNavigation>,
			{ passiveHashAlignmentEnabled: boolean }
		>(
			({ passiveHashAlignmentEnabled }) =>
				useTopicDetailNavigation(
					createNavigationOptions({
						passiveHashAlignmentEnabled,
						rootTopicId: 1,
						scrollContainerElement: scrollContainer,
						sectionIds: [1, 2],
					}),
				),
			{
				initialProps: {
					passiveHashAlignmentEnabled: false,
				},
			},
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			vi.runAllTimers()
		})

		expect(scrollContainer.scrollTop).toBe(0)

		act(() => {
			rerender({
				passiveHashAlignmentEnabled: true,
			})
			vi.runAllTimers()
		})

		expect(scrollContainer.scrollTop).toBe(320)
	})

	it('waits for the scroll container ref before resolving a deep link', () => {
		currentHash = 'topic-2'

		const scrollContainer = document.createElement('div')
		attachScrollToSpy(scrollContainer)
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		mockRectFromScrollPosition(sectionTwo, scrollContainer, 320)

		const { result, rerender } = renderHook<
			ReturnType<typeof useTopicDetailNavigation>,
			{
				scrollContainerElement: HTMLDivElement | null
				scrollContainerVersion: number
			}
		>(
			({ scrollContainerElement, scrollContainerVersion }) =>
				useTopicDetailNavigation(
					createNavigationOptions({
						rootTopicId: 1,
						scrollContainerElement,
						scrollContainerVersion,
						sectionIds: [1, 2],
					}),
				),
			{
				initialProps: {
					scrollContainerElement: null,
					scrollContainerVersion: 0,
				},
			},
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			vi.runAllTimers()
		})

		expect(scrollContainer.scrollTop).toBe(0)

		act(() => {
			rerender({
				scrollContainerElement: scrollContainer,
				scrollContainerVersion: 1,
			})
			flushAnimationFrames()
			vi.runAllTimers()
		})

		expect(scrollContainer.scrollTop).toBe(320)
	})

	it('cancels pending hash alignment when the user scrolls the container', () => {
		currentHash = 'topic-2'

		const scrollContainer = document.createElement('div')
		attachScrollToSpy(scrollContainer)
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		mockRectFromScrollPosition(sectionTwo, scrollContainer, 320)

		const { result } = renderHook(() =>
			useTopicDetailNavigation(
				createNavigationOptions({
					rootTopicId: 1,
					scrollContainerElement: scrollContainer,
					sectionIds: [1, 2],
				}),
			),
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			flushAnimationFrames()
			vi.advanceTimersByTime(100)
		})

		expect(scrollContainer.scrollTop).toBe(320)

		scrollContainer.scrollTop = 120

		act(() => {
			scrollContainer.dispatchEvent(new Event('wheel'))
			vi.runAllTimers()
		})

		expect(scrollContainer.scrollTop).toBe(120)
	})

	it('does not snap back to the hash target after the alignment window expires', () => {
		currentHash = 'topic-2'

		const scrollContainer = document.createElement('div')
		attachScrollToSpy(scrollContainer)
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220),
		)
		mockRectFromScrollPosition(sectionOne, scrollContainer, 20)
		mockRectFromScrollPosition(sectionTwo, scrollContainer, 320)

		const { result } = renderHook(() =>
			useTopicDetailNavigation(
				createNavigationOptions({
					rootTopicId: 1,
					scrollContainerElement: scrollContainer,
					sectionIds: [1, 2],
				}),
			),
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			flushAnimationFrames()
			vi.advanceTimersByTime(100)
		})

		expect(scrollContainer.scrollTop).toBe(320)

		act(() => {
			vi.runAllTimers()
			scrollContainer.scrollTop = 120
			result.current.registerSectionHeadingRef(2, null)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(120)
	})
})
