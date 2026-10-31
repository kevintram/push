import * as stylex from '@stylexjs/stylex'
import type { PointerEventHandler } from 'react'

const styles = stylex.create({
	handle: {
		insetBlock: 0,
		position: 'absolute',
		zIndex: 2,

		cursor: 'col-resize',
		inlineSize: 12,
		touchAction: 'none',
		// Centers the handle on the inset its xstyle sets.
		transform: 'translateX(-50%)',
	},
})

type ResizeHandleProps = {
	onPointerDown: PointerEventHandler<HTMLElement>
	onPointerMove: PointerEventHandler<HTMLElement>
	onPointerUp: PointerEventHandler<HTMLElement>
	onPointerCancel: PointerEventHandler<HTMLElement>
	onDoubleClick: () => void
	/**
	 * Sets `insetInlineStart` to the middle of the gap beside the sidebar,
	 * where the handle centers.
	 */
	xstyle: stylex.StyleXStyles
}

/**
 * Drag target on a sidebar edge, driven by `useResizableWidth`. Render it as a
 * direct child of a positioned sidebar that neither scrolls nor clips its
 * overflow.
 */
export function ResizeHandle({ xstyle, ...handlers }: ResizeHandleProps) {
	return (
		<div
			role='separator'
			aria-orientation='vertical'
			{...handlers}
			{...stylex.props(styles.handle, xstyle)}
		/>
	)
}
