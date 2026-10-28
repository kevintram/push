import type { PointerEvent } from 'react'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { readStoredNumber, writeStoredNumber } from '~/utils/storage'

export type ResizeEdge = 'start' | 'end'

type ResizableWidthOptions = {
	storageKey: string
	defaultWidth: number
	minWidth: number
	/** Omit to leave the width unbounded, such as when CSS caps it instead. */
	maxWidth?: number
	/** The sidebar edge the handle sits on; dragging it outward widens. */
	edge: ResizeEdge
}

type Drag = {
	startX: number
	startWidth: number
	width: number
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

/** The on-screen width of the sidebar the handle sits in, when it has one. */
function measureSidebar(event: PointerEvent<HTMLElement>) {
	const width =
		event.currentTarget.parentElement?.getBoundingClientRect().width
	return width ? Math.round(width) : undefined
}

/**
 * Pixel width for a sidebar that the user drags to resize. The width starts
 * from browser storage and is written back when a drag ends.
 *
 * Spread `handleProps` onto a `ResizeHandle` rendered as a direct child of
 * the sidebar. The hook measures the sidebar through it, so a drag starts
 * from, and saves, the width on screen even when CSS caps it below the
 * dragged one.
 */
export function useResizableWidth({
	storageKey,
	defaultWidth,
	minWidth,
	maxWidth = Number.POSITIVE_INFINITY,
	edge,
}: ResizableWidthOptions) {
	const [width, setWidth] = useState(() =>
		clamp(readStoredNumber(storageKey, defaultWidth), minWidth, maxWidth),
	)
	const drag = useRef<Drag | null>(null)

	function onPointerDown(event: PointerEvent<HTMLElement>) {
		if (event.button !== 0) {
			return
		}
		// Keeps the drag from selecting text along the way.
		event.preventDefault()
		event.currentTarget.setPointerCapture(event.pointerId)
		drag.current = {
			startX: event.clientX,
			startWidth: measureSidebar(event) ?? width,
			width,
		}
	}

	function onPointerMove(event: PointerEvent<HTMLElement>) {
		const current = drag.current
		if (current === null) {
			return
		}
		// Assumes left-to-right layout: the end edge is on the right.
		const delta = event.clientX - current.startX
		current.width = Math.round(
			clamp(
				current.startWidth + (edge === 'end' ? delta : -delta),
				minWidth,
				maxWidth,
			),
		)
		setWidth(current.width)
	}

	function endDrag(event: PointerEvent<HTMLElement>) {
		const current = drag.current
		if (current === null) {
			return
		}
		// Commits the last move so the measurement below sees it.
		flushSync(() => setWidth(current.width))
		// Drops any overshoot past a CSS cap, so the sidebar reopens at the
		// width the user saw rather than one it could not reach.
		const finalWidth = Math.min(
			current.width,
			measureSidebar(event) ?? current.width,
		)
		setWidth(finalWidth)
		writeStoredNumber(storageKey, finalWidth)
		drag.current = null
	}

	function resetWidth() {
		setWidth(defaultWidth)
		writeStoredNumber(storageKey, defaultWidth)
	}

	return {
		width,
		handleProps: {
			onPointerDown,
			onPointerMove,
			onPointerUp: endDrag,
			onPointerCancel: endDrag,
			onDoubleClick: resetWidth,
		},
	}
}
