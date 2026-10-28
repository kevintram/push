import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ResizeHandle } from '~/components/ResizeHandle'

import { type ResizeEdge, useResizableWidth } from '../useResizableWidth'

const KEY = 'sidebarWidth'

const styles = stylex.create({
	handle: {
		insetInlineStart: '100%',
	},
})

function Sidebar({ edge }: { edge: ResizeEdge }) {
	const { width, handleProps } = useResizableWidth({
		storageKey: KEY,
		defaultWidth: 240,
		minWidth: 200,
		maxWidth: 400,
		edge,
	})
	return (
		<aside data-testid='sidebar' data-width={width}>
			<ResizeHandle {...handleProps} xstyle={styles.handle} />
		</aside>
	)
}

function drag(fromX: number, toX: number) {
	const handle = screen.getByRole('separator')
	fireEvent.pointerDown(handle, { button: 0, clientX: fromX })
	fireEvent.pointerMove(handle, { clientX: toX })
	fireEvent.pointerUp(handle, { clientX: toX })
}

function renderedWidth() {
	return Number(screen.getByTestId('sidebar').dataset.width)
}

describe('useResizableWidth', () => {
	beforeAll(() => {
		// Happy DOM does not implement pointer capture.
		HTMLElement.prototype.setPointerCapture ??= () => {}
	})

	afterEach(() => {
		window.localStorage.clear()
		vi.restoreAllMocks()
	})

	it('starts from the stored width, clamped to the bounds', () => {
		window.localStorage.setItem(KEY, '900')

		render(<Sidebar edge='end' />)

		expect(renderedWidth()).toBe(400)
	})

	it('widens when the end edge is dragged outward and stores the result', () => {
		render(<Sidebar edge='end' />)

		drag(100, 160)

		expect(renderedWidth()).toBe(300)
		expect(window.localStorage.getItem(KEY)).toBe('300')
	})

	it('widens when the start edge is dragged outward', () => {
		render(<Sidebar edge='start' />)

		drag(100, 70)

		expect(renderedWidth()).toBe(270)
	})

	it('starts a drag from the rendered width when CSS caps the sidebar', () => {
		window.localStorage.setItem(KEY, '360')
		render(<Sidebar edge='end' />)
		vi.spyOn(
			screen.getByTestId('sidebar'),
			'getBoundingClientRect',
		).mockReturnValue(new DOMRect(0, 0, 300, 0))

		drag(100, 90)

		expect(renderedWidth()).toBe(290)
	})

	it('saves the rendered width when dragged past a CSS cap', () => {
		render(<Sidebar edge='end' />)
		vi.spyOn(
			screen.getByTestId('sidebar'),
			'getBoundingClientRect',
		).mockReturnValue(new DOMRect(0, 0, 300, 0))

		drag(100, 300)

		expect(renderedWidth()).toBe(300)
		expect(window.localStorage.getItem(KEY)).toBe('300')
	})

	it('stops at the minimum width', () => {
		render(<Sidebar edge='end' />)

		drag(100, -500)

		expect(renderedWidth()).toBe(200)
	})

	it('ignores pointer movement without a drag', () => {
		render(<Sidebar edge='end' />)

		fireEvent.pointerMove(screen.getByRole('separator'), { clientX: 500 })

		expect(renderedWidth()).toBe(240)
		expect(window.localStorage.getItem(KEY)).toBeNull()
	})

	it('resets to the default width on double-click', () => {
		window.localStorage.setItem(KEY, '360')
		render(<Sidebar edge='end' />)

		fireEvent.doubleClick(screen.getByRole('separator'))

		expect(renderedWidth()).toBe(240)
		expect(window.localStorage.getItem(KEY)).toBe('240')
	})
})
