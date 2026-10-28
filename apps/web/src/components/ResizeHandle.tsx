import * as stylex from '@stylexjs/stylex'
import type { PointerEventHandler } from 'react'

import type { ResizeEdge } from '~/hooks/useResizableWidth'

const styles = stylex.create({
	handle: {
		insetBlock: 0,
		position: 'absolute',
		zIndex: 2,

		cursor: 'col-resize',
		inlineSize: 8,
		touchAction: 'none',
	},
	start: {
		insetInlineStart: 0,
	},
	end: {
		insetInlineEnd: 0,
	},
})

type ResizeHandleProps = {
	edge: ResizeEdge
	onPointerDown: PointerEventHandler<HTMLElement>
	onPointerMove: PointerEventHandler<HTMLElement>
	onPointerUp: PointerEventHandler<HTMLElement>
	onPointerCancel: PointerEventHandler<HTMLElement>
	onDoubleClick: () => void
}

/**
 * Drag target on a sidebar edge, driven by `useResizableWidth`. Render it as
 * a direct child of a positioned sidebar that does not scroll, or it scrolls
 * away with the content.
 */
export function ResizeHandle({ edge, ...handlers }: ResizeHandleProps) {
	return (
		<div
			role='separator'
			aria-orientation='vertical'
			{...handlers}
			{...stylex.props(
				styles.handle,
				edge === 'start' ? styles.start : styles.end,
			)}
		/>
	)
}
