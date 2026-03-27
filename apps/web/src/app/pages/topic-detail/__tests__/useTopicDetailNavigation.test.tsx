import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

describe('useTopicDetailNavigation', () => {
	const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
	const originalRequestAnimationFrame = window.requestAnimationFrame
	const originalCancelAnimationFrame = window.cancelAnimationFrame
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
		window.history.replaceState({}, '', '/topics/1')
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
		document.body.innerHTML = ''
	})

	it('keeps the URL stable while scroll spy updates visible heading blocks', () => {
		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		const sectionThree = document.createElement('section')
		const sectionThreeScrollIntoView = vi.fn()
		const sectionTwoScrollIntoView = vi.fn()

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo, sectionThree)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'
		sectionThree.dataset.topicDetailHeadingId = '3'

		sectionTwo.scrollIntoView = sectionTwoScrollIntoView
		sectionThree.scrollIntoView = sectionThreeScrollIntoView

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

		const { result } = renderHook(() =>
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

		expect(window.location.hash).toBe('')
		expect(result.current.visibleSectionIds).toEqual([1, 2])

		act(() => {
			result.current.scrollToSection(3, {
				behavior: 'auto'
			})
			flushAnimationFrames()
		})

		expect(window.location.hash).toBe('#topic-3')
		expect(sectionThreeScrollIntoView).toHaveBeenCalledTimes(1)
		expect(sectionThreeScrollIntoView).toHaveBeenCalledWith({
			behavior: 'auto',
			block: 'start'
		})
		expect(result.current.visibleSectionIds).toEqual([1, 2])

		sectionTwoScrollIntoView.mockClear()

		act(() => {
			result.current.scrollToSection(2)
			flushAnimationFrames()
		})

		expect(window.location.hash).toBe('#topic-2')
		expect(sectionTwoScrollIntoView).toHaveBeenCalledTimes(1)
		expect(sectionTwoScrollIntoView).toHaveBeenCalledWith({
			behavior: 'smooth',
			block: 'start'
		})

		sectionOneRect.mockReturnValue(createDomRect(-80, 60))
		sectionTwoRect.mockReturnValue(createDomRect(20, 60))

		act(() => {
			scrollContainer.dispatchEvent(new Event('scroll'))
			flushAnimationFrames()
		})

		expect(window.location.hash).toBe('#topic-2')
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
		window.history.replaceState({}, '', '/topics/1#topic-2')

		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		const sectionTwoScrollIntoView = vi.fn()

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'
		sectionTwo.scrollIntoView = sectionTwoScrollIntoView

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

		expect(sectionTwoScrollIntoView).toHaveBeenCalledTimes(1)

		act(() => {
			rerender({
				sectionIds: [1, 2, 3]
			})
			flushAnimationFrames()
		})

		expect(sectionTwoScrollIntoView).toHaveBeenCalledTimes(1)
	})

	it('scrolls once for external hash navigation after mount', () => {
		window.history.replaceState({}, '', '/topics/1#topic-2')

		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		const sectionTwoScrollIntoView = vi.fn()

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)
		sectionOne.dataset.topicDetailHeadingId = '1'
		sectionTwo.dataset.topicDetailHeadingId = '2'
		sectionTwo.scrollIntoView = sectionTwoScrollIntoView

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0, 220)
		)
		vi.spyOn(sectionOne, 'getBoundingClientRect').mockReturnValue(
			createDomRect(20, 60)
		)
		vi.spyOn(sectionTwo, 'getBoundingClientRect').mockReturnValue(
			createDomRect(320, 60)
		)

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

		expect(window.location.hash).toBe('#topic-2')
		expect(sectionTwoScrollIntoView).toHaveBeenCalledTimes(1)
		expect(sectionTwoScrollIntoView).toHaveBeenCalledWith({
			block: 'start'
		})
	})
})
