import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTopicDocumentNavigation } from '../useTopicDocumentNavigation'

function createDomRect(top: number): DOMRect {
	return {
		bottom: top + 40,
		height: 40,
		left: 0,
		right: 0,
		toJSON: () => ({}),
		top,
		width: 0,
		x: 0,
		y: top
	} as DOMRect
}

describe('useTopicDocumentNavigation', () => {
	const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
	const originalRequestAnimationFrame = window.requestAnimationFrame
	const originalCancelAnimationFrame = window.cancelAnimationFrame

	beforeEach(() => {
		window.history.replaceState({}, '', '/topics/1')
		window.requestAnimationFrame = vi.fn(callback => {
			callback(0)
			return 1
		})
		window.cancelAnimationFrame = vi.fn()
	})

	afterEach(() => {
		HTMLElement.prototype.scrollIntoView = originalScrollIntoView
		window.requestAnimationFrame = originalRequestAnimationFrame
		window.cancelAnimationFrame = originalCancelAnimationFrame
		document.body.innerHTML = ''
	})

	it('keeps the URL stable while scroll spy updates the active section', () => {
		const scrollContainer = document.createElement('div')
		const sectionOne = document.createElement('section')
		const sectionTwo = document.createElement('section')
		const sectionOneScrollIntoView = vi.fn()
		const sectionTwoScrollIntoView = vi.fn()

		document.body.append(scrollContainer)
		scrollContainer.append(sectionOne, sectionTwo)

		sectionOne.scrollIntoView = sectionOneScrollIntoView
		sectionTwo.scrollIntoView = sectionTwoScrollIntoView

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(
			createDomRect(0)
		)
		const sectionOneRect = vi
			.spyOn(sectionOne, 'getBoundingClientRect')
			.mockReturnValue(createDomRect(100))
		vi.spyOn(sectionTwo, 'getBoundingClientRect').mockReturnValue(
			createDomRect(260)
		)

		const { result } = renderHook(() =>
			useTopicDocumentNavigation({
				rootTopicId: 1,
				scrollContainerRef: { current: scrollContainer },
				sectionIds: [1, 2]
			})
		)

		act(() => {
			result.current.registerSectionRef(1, sectionOne)
			result.current.registerSectionRef(2, sectionTwo)
		})

		expect(window.location.hash).toBe('')
		expect(result.current.activeSectionId).toBe(1)

		act(() => {
			result.current.scrollToSection(2, {
				behavior: 'auto'
			})
		})

		expect(window.location.hash).toBe('#topic-2')
		expect(sectionTwoScrollIntoView).toHaveBeenCalled()
		expect(result.current.activeSectionId).toBe(2)

		sectionOneRect.mockReturnValue(createDomRect(90))

		act(() => {
			scrollContainer.dispatchEvent(new Event('scroll'))
		})

		expect(window.location.hash).toBe('#topic-2')
		expect(sectionOneScrollIntoView).not.toHaveBeenCalled()
	})
})
