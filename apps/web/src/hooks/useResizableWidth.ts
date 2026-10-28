import type { PointerEvent } from 'react'
import { useRef, useState } from 'react'

import { readStoredNumber, writeStoredNumber } from '~/utils/storage'

export type ResizeEdge = 'start' | 'end'

type ResizableWidthOptions = {
	storageKey: string
	defaultWidth: number
	minWidth: number
	maxWidth: number
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

/**
 * Pixel width for a sidebar that the user drags to resize. The width starts
 * from browser storage and is written back when a drag ends.
 *
 * Spread `handleProps` onto a `ResizeHandle` rendered as a direct child of
 * the sidebar, so a drag starts from the sidebar's rendered width even when
 * CSS caps it below the stored one.
 */
export function useResizableWidth({
	storageKey,
	defaultWidth,
	minWidth,
	maxWidth,
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
		const renderedWidth =
			event.currentTarget.parentElement?.getBoundingClientRect().width
		drag.current = {
			startX: event.clientX,
			startWidth: renderedWidth || width,
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

	function endDrag() {
		if (drag.current === null) {
			return
		}
		writeStoredNumber(storageKey, drag.current.width)
		drag.current = null
	}

	function resetWidth() {
		setWidth(defaultWidth)
		writeStoredNumber(storageKey, defaultWidth)
	}

	return {
		width,
		handleProps: {
			edge,
			onPointerDown,
			onPointerMove,
			onPointerUp: endDrag,
			onPointerCancel: endDrag,
			onDoubleClick: resetWidth,
		},
	}
}
