import { act, fireEvent, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useOffscreenDirection } from '../useOffscreenDirection'

const resizeObservers: Array<FakeResizeObserver> = []

class FakeResizeObserver {
	readonly callback: () => void
	readonly observed: Array<Element> = []
	disconnected = false

	constructor(callback: () => void) {
		this.callback = callback
		resizeObservers.push(this)
	}

	observe(element: Element) {
		this.observed.push(element)
	}

	disconnect() {
		this.disconnected = true
	}
}

function setRect(element: HTMLElement, top: number, bottom: number) {
	const rect = { top, bottom, left: 0, right: 100, width: 100 }
	vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
		...rect,
		height: bottom - top,
		x: 0,
		y: top,
		toJSON: () => rect,
	})
	vi.spyOn(element, 'getClientRects').mockReturnValue([
		element.getBoundingClientRect(),
	] as unknown as DOMRectList)
}

let root: HTMLElement
let content: HTMLElement
let target: HTMLElement

describe('useOffscreenDirection', () => {
	beforeEach(() => {
		resizeObservers.length = 0
		vi.stubGlobal('ResizeObserver', FakeResizeObserver)

		root = document.createElement('div')
		content = document.createElement('ul')
		target = document.createElement('a')
		content.append(target)
		root.append(content)
		document.body.append(root)
		setRect(root, 100, 300)
	})

	afterEach(() => {
		root.remove()
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('reports nothing while part of the target is visible', () => {
		setRect(target, 290, 320)

		const { result } = renderHook(() => useOffscreenDirection(root, target))

		expect(result.current).toBeUndefined()
	})

	it.each([
		{ direction: 'above', top: 60, bottom: 100 },
		{ direction: 'below', top: 300, bottom: 340 },
	])(
		'reports $direction when the target is fully outside',
		({ direction, top, bottom }) => {
			setRect(target, top, bottom)

			const { result } = renderHook(() =>
				useOffscreenDirection(root, target),
			)

			expect(result.current).toBe(direction)
		},
	)

	it('counts the scroll padding as outside the visible area', () => {
		root.style.scrollPaddingTop = '24px'
		root.style.scrollPaddingBottom = '24px'
		setRect(target, 280, 300)

		const { result } = renderHook(() => useOffscreenDirection(root, target))

		expect(result.current).toBe('below')
	})

	it('reports nothing for a target that is not rendered', () => {
		setRect(target, 300, 340)
		vi.spyOn(target, 'getClientRects').mockReturnValue(
			[] as unknown as DOMRectList,
		)

		const { result } = renderHook(() => useOffscreenDirection(root, target))

		expect(result.current).toBeUndefined()
	})

	it('remeasures when the root scrolls', () => {
		setRect(target, 150, 180)
		const { result } = renderHook(() => useOffscreenDirection(root, target))
		expect(result.current).toBeUndefined()

		setRect(target, 20, 50)
		fireEvent.scroll(root)

		expect(result.current).toBe('above')
	})

	it('remeasures when the root or its content resizes', () => {
		setRect(target, 150, 180)
		const { result } = renderHook(() => useOffscreenDirection(root, target))
		const [observer] = resizeObservers
		expect(observer?.observed).toEqual([root, content])

		setRect(target, 320, 350)
		act(() => observer?.callback())

		expect(result.current).toBe('below')
	})

	it('remeasures when rows move without changing any size', async () => {
		const sibling = document.createElement('li')
		content.append(sibling)
		setRect(target, 150, 180)
		const { result } = renderHook(() => useOffscreenDirection(root, target))
		expect(result.current).toBeUndefined()

		// A collection moved into an open branch above the target pushes it down
		// while the list keeps its height, so no resize is observed.
		setRect(target, 310, 340)
		content.prepend(sibling)

		await waitFor(() => expect(result.current).toBe('below'))
	})

	it('stops measuring and resets when the target goes away', () => {
		setRect(target, 300, 340)
		const { result, rerender } = renderHook(
			({ element }) => useOffscreenDirection(root, element),
			{ initialProps: { element: target as HTMLElement | null } },
		)
		expect(result.current).toBe('below')

		rerender({ element: null })

		expect(result.current).toBeUndefined()
		expect(resizeObservers[0]?.disconnected).toBe(true)
	})
})
