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
	/** Lets a drag collapse the sidebar, and a drag from collapsed open it. */
	collapse?: {
		isCollapsed: boolean
		onCollapsedChange: (isCollapsed: boolean) => void
	}
}

type Drag = {
	startX: number
	startWidth: number
	width: number
	/** The width before the drag, restored if the drag ends collapsed. */
	initialWidth: number
	isCollapsed: boolean
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
 *
 * With `collapse`, the sidebar collapses once a drag pulls it under a quarter
 * of `minWidth`, and opens at `minWidth` once a drag from collapsed passes
 * it, as in Linear. The handle has to stay mounted in both states so one drag
 * can cross either way.
 */
export function useResizableWidth({
	storageKey,
	defaultWidth,
	minWidth,
	maxWidth = Number.POSITIVE_INFINITY,
	edge,
	collapse,
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
		const isCollapsed = collapse?.isCollapsed ?? false
		drag.current = {
			startX: event.clientX,
			// A collapsed sidebar may measure 0, such as one that hides
			// entirely, which must not fall back to the open width.
			startWidth: measureSidebar(event) ?? (isCollapsed ? 0 : width),
			width,
			initialWidth: width,
			isCollapsed,
		}
	}

	function onPointerMove(event: PointerEvent<HTMLElement>) {
		const current = drag.current
		if (current === null) {
			return
		}
		// Assumes left-to-right layout: the end edge is on the right.
		const delta = event.clientX - current.startX
		const draggedWidth =
			current.startWidth + (edge === 'end' ? delta : -delta)
		if (collapse) {
			const shouldCollapse = draggedWidth < minWidth / 4
			if (shouldCollapse !== current.isCollapsed) {
				current.isCollapsed = shouldCollapse
				collapse.onCollapsedChange(shouldCollapse)
			}
			if (shouldCollapse) {
				return
			}
		}
		current.width = Math.round(clamp(draggedWidth, minWidth, maxWidth))
		setWidth(current.width)
	}

	function endDrag(event: PointerEvent<HTMLElement>) {
		const current = drag.current
		if (current === null) {
			return
		}
		drag.current = null
		if (current.isCollapsed) {
			// Opens again at the width the user had, not the one they dragged
			// through on the way to collapsing.
			setWidth(current.initialWidth)
			writeStoredNumber(storageKey, current.initialWidth)
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
