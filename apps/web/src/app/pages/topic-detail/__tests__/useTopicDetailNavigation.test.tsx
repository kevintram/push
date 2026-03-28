import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()
let currentHash = ''

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => navigateMock,
	useRouterState: ({
		select
	}: {
		select: (state: { location: { hash: string } }) => unknown
	}) => select({ location: { hash: currentHash } })
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
		y: top
	} as DOMRect
}

function attachScrollToSpy(element: HTMLDivElement) {
	const scrollTo = vi.fn((options?: ScrollToOptions | number, _y?: number) => {
		if (typeof options === 'number') {
			element.scrollTop = options
			return
		}

		element.scrollTop = options?.top ?? element.scrollTop
	})

	Object.defineProperty(element, 'scrollTo', {
		value: scrollTo,
		configurable: true
	})

	return scrollTo
}

function createResizeObserverStub() {
	const observe = vi.fn()
	const disconnect = vi.fn()
	let callback: ResizeObserverCallback | null = null

	class ResizeObserverStub {
		constructor(nextCallback: ResizeObserverCallback) {
			callback = nextCallback
		}

		observe = observe
		disconnect = disconnect
	}

	return {
		ResizeObserverStub,
		observe,
		disconnect,
		getCallback: () => callback
	}
}

function createMutationObserverStub() {
	const observe = vi.fn()
	const disconnect = vi.fn()
	let callback: MutationCallback | null = null

	class MutationObserverStub {
		constructor(nextCallback: MutationCallback) {
			callback = nextCallback
		}

		observe = observe
		disconnect = disconnect
	}

	return {
		MutationObserverStub,
		observe,
		disconnect,
		getCallback: () => callback
	}
}

describe('useTopicDetailNavigation', () => {
	const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
	const originalRequestAnimationFrame = window.requestAnimationFrame
	const originalCancelAnimationFrame = window.cancelAnimationFrame
	const originalResizeObserver = globalThis.ResizeObserver
	const originalMutationObserver = globalThis.MutationObserver
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
	})

	afterEach(() => {
		HTMLElement.prototype.scrollIntoView = originalScrollIntoView
		window.requestAnimationFrame = originalRequestAnimationFrame
		window.cancelAnimationFrame = originalCancelAnimationFrame
		globalThis.ResizeObserver = originalResizeObserver
		globalThis.MutationObserver = originalMutationObserver
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
			createDomRect(0, 220)
		)
		const sectionOneRect = vi
			.spyOn(sectionOne, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(20, 60))
		const sectionTwoRect = vi
			.spyOn(sectionTwo, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(130, 60))
		vi.spyOn(sectionThree, 'getBoundingClientRect').mockReturnValue(
			createDomRect(260, 60)
		)

		const { result, rerender } = renderHook(() =>
			useTopicDetailNavigation({
				rootTopicId: 1,
				scrollContainerElement: scrollContainer,
				sectionIds: [1, 2, 3]
			})
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
				behavior: 'auto'
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
			hashScrollIntoView: false
		})
		expect(scrollContainer.scrollTop).toBe(260)
		expect(scrollContainerScrollTo).not.toHaveBeenCalled()

		sectionOneRect.mockReturnValue(createDomRect(-240, 60))
		sectionTwoRect.mockReturnValue(createDomRect(-130, 60))

		await act(async () => {
			result.current.scrollToSection(2, {
				mode: 'replace'
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
			hashScrollIntoView: false
		})
		expect(scrollContainerScrollTo).toHaveBeenCalledTimes(1)
		expect(scrollContainerScrollTo).toHaveBeenCalledWith({
			top: 130,
			behavior: 'smooth'
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
			createDomRect(0, 220)
		)
		const sectionOneRect = vi
			.spyOn(sectionOne, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(20, 60))
		const sectionTwoRect = vi
			.spyOn(sectionTwo, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(130, 60))

		const { result, rerender } = renderHook<
			ReturnType<typeof useTopicDetailNavigation>,
			{ scrollContainerElement: HTMLDivElement | null }
		>(
			({ scrollContainerElement }) =>
				useTopicDetailNavigation({
					rootTopicId: 1,
					scrollContainerElement,
					sectionIds: [1, 2]
				}),
			{
				initialProps: {
					scrollContainerElement: null
				}
			}
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
				scrollContainerElement: scrollContainer
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

	it('does not re-scroll the current hash target when section ids refresh', () => {
		currentHash = 'topic-2'

		const resizeObserver = createResizeObserverStub()
		const mutationObserver = createMutationObserverStub()
		globalThis.ResizeObserver = resizeObserver.ResizeObserverStub as never
		globalThis.MutationObserver = mutationObserver.MutationObserverStub as never

		const scrollContainer = document.createElement('div')
		attachScrollToSpy(scrollContainer)
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220)
		)
		vi.spyOn(sectionOne, 'getBoundingClientRect').mockReturnValue(
			createDomRect(20, 60)
		)
		vi.spyOn(sectionTwo, 'getBoundingClientRect').mockReturnValue(
			createDomRect(130, 60)
		)

		const { result, rerender } = renderHook(
			({ sectionIds }: { sectionIds: Array<number> }) =>
				useTopicDetailNavigation({
					rootTopicId: 1,
					scrollContainerElement: scrollContainer,
					sectionIds
				}),
			{
				initialProps: {
					sectionIds: [1, 2]
				}
			}
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			flushAnimationFrames()
			rerender({
				sectionIds: [1, 2]
			})
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(130)
		scrollContainer.scrollTop = 16

		act(() => {
			rerender({
				sectionIds: [1, 2, 3]
			})
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(16)
	})

	it('re-aligns the current hash target after delayed layout changes', () => {
		currentHash = 'topic-2'

		const resizeObserver = createResizeObserverStub()
		const mutationObserver = createMutationObserverStub()
		globalThis.ResizeObserver = resizeObserver.ResizeObserverStub as never
		globalThis.MutationObserver = mutationObserver.MutationObserverStub as never

		const scrollContainer = document.createElement('div')
		attachScrollToSpy(scrollContainer)
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220)
		)
		vi.spyOn(sectionOne, 'getBoundingClientRect').mockReturnValue(
			createDomRect(20, 60)
		)
		const sectionTwoRect = vi
			.spyOn(sectionTwo, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(320, 60))

		const { result } = renderHook(() =>
			useTopicDetailNavigation({
				rootTopicId: 1,
				scrollContainerElement: scrollContainer,
				sectionIds: [1, 2]
			})
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(320)
		expect(mutationObserver.observe).toHaveBeenCalled()
		expect(resizeObserver.observe).toHaveBeenCalled()

		sectionTwoRect.mockReturnValue(createDomRect(220, 60))

		act(() => {
			mutationObserver.getCallback()?.([], {} as MutationObserver)
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(540)
	})

	it('cancels pending hash alignment when the user scrolls the container', () => {
		currentHash = 'topic-2'

		const resizeObserver = createResizeObserverStub()
		const mutationObserver = createMutationObserverStub()
		globalThis.ResizeObserver = resizeObserver.ResizeObserverStub as never
		globalThis.MutationObserver = mutationObserver.MutationObserverStub as never

		const scrollContainer = document.createElement('div')
		attachScrollToSpy(scrollContainer)
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220)
		)
		vi.spyOn(sectionOne, 'getBoundingClientRect').mockReturnValue(
			createDomRect(20, 60)
		)
		const sectionTwoRect = vi
			.spyOn(sectionTwo, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(320, 60))

		const { result } = renderHook(() =>
			useTopicDetailNavigation({
				rootTopicId: 1,
				scrollContainerElement: scrollContainer,
				sectionIds: [1, 2]
			})
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(320)

		scrollContainer.scrollTop = 120
		sectionTwoRect.mockReturnValue(createDomRect(120, 60))

		act(() => {
			scrollContainer.dispatchEvent(new Event('wheel'))
			mutationObserver.getCallback()?.([], {} as MutationObserver)
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(120)
	})

	it('does not snap back to the hash target after the user scrolls away', () => {
		currentHash = 'topic-2'

		const resizeObserver = createResizeObserverStub()
		const mutationObserver = createMutationObserverStub()
		globalThis.ResizeObserver = resizeObserver.ResizeObserverStub as never
		globalThis.MutationObserver = mutationObserver.MutationObserverStub as never

		const scrollContainer = document.createElement('div')
		attachScrollToSpy(scrollContainer)
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220)
		)
		vi.spyOn(sectionOne, 'getBoundingClientRect').mockReturnValue(
			createDomRect(20, 60)
		)
		const sectionTwoRect = vi
			.spyOn(sectionTwo, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(320, 60))

		const { result } = renderHook(() =>
			useTopicDetailNavigation({
				rootTopicId: 1,
				scrollContainerElement: scrollContainer,
				sectionIds: [1, 2]
			})
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
			result.current.registerSectionHeadingRef(1, sectionOne)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(320)

		sectionTwoRect.mockReturnValue(createDomRect(20, 60))

		act(() => {
			mutationObserver.getCallback()?.([], {} as MutationObserver)
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(320)

		scrollContainer.scrollTop = 120
		sectionTwoRect.mockReturnValue(createDomRect(120, 60))

		act(() => {
			result.current.registerSectionHeadingRef(2, null)
			result.current.registerSectionHeadingRef(2, sectionTwo)
			mutationObserver.getCallback()?.([], {} as MutationObserver)
			flushAnimationFrames()
		})

		expect(scrollContainer.scrollTop).toBe(120)
	})
})
