import * as stylex from '@stylexjs/stylex'
import type { PointerEventHandler } from 'react'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { radii } from '~/styles/tokens.stylex'

const styles = stylex.create({
	handle: {
		insetBlock: 0,
		position: 'absolute',
		zIndex: 2,

		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',

		cursor: 'col-resize',
		inlineSize: 12,
		touchAction: 'none',
		// Centers the handle on the inset its xstyle sets.
		transform: 'translateX(-50%)',
	},
	// Shows while the pointer is over the handle.
	pill: {
		borderRadius: radii.full,
		backgroundColor: colorsSemantic.borderInteractiveHover,
		blockSize: 48,
		inlineSize: 6,
		opacity: {
			default: 0,
			[stylex.when.ancestor(':hover')]: 1,
		},
	},
	pillDragging: {
		backgroundColor: colorsSemantic.textInteractive,
		opacity: 1,
	},
})

type ResizeHandleProps = {
	isDragging: boolean
	onPointerDown: PointerEventHandler<HTMLElement>
	onPointerMove: PointerEventHandler<HTMLElement>
	onPointerUp: PointerEventHandler<HTMLElement>
	onPointerCancel: PointerEventHandler<HTMLElement>
	onDoubleClick: () => void
	/**
	 * Sets `insetInlineStart` to the middle of the gap beside the sidebar,
	 * where the handle centers and the pill shows.
	 */
	xstyle: stylex.StyleXStyles
}

/**
 * Drag target on a sidebar edge, driven by `useResizableWidth`. A pill in the
 * middle of the edge shows while the pointer is over it or dragging. Render it as a
 * direct child of a positioned sidebar that neither scrolls nor clips its
 * overflow.
 */
export function ResizeHandle({
	isDragging,
	xstyle,
	...handlers
}: ResizeHandleProps) {
	return (
		<div
			role='separator'
			aria-orientation='vertical'
			{...handlers}
			{...stylex.props(styles.handle, stylex.defaultMarker(), xstyle)}
		>
			<div
				{...stylex.props(
					styles.pill,
					isDragging && styles.pillDragging,
				)}
			/>
		</div>
	)
}
