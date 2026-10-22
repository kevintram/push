import { DragOverlay } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { appSidebar, fontSizes, radii, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	// dnd-kit sizes the overlay to the dragged row; this fills it. The overlay
	// element stays unstyled because it sits in the collection tree's flex layout even
	// between drags, where padding on it would take up width.
	row: {
		alignItems: 'center',
		blockSize: '100%',
		display: 'flex',
		// Keeps the title where it sat in the row: the row's title offset,
		// less the chip's padding and border.
		paddingInlineStart: `calc(${appSidebar.rowInset} + ${appSidebar.iconSize} - 1px)`,
	},
	// Shaped like a tooltip. Tertiary rather than raised, which matches the
	// sidebar's own background.
	chip: {
		borderColor: semanticColors.borderSubtle,
		borderRadius: radii.xs,
		borderStyle: 'solid',
		borderWidth: '1px',
		overflow: 'hidden',
		paddingBlock: '6px',
		paddingInline: spacing.sm,
		backgroundColor: semanticColors.surfaceTertiary,
		boxShadow: `0 4px 12px ${semanticColors.shadowPrimary}`,
		color: semanticColors.textPrimary,
		fontSize: fontSizes.sm,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
})

/** Renders a minimal, opaque title chip in place of the dragged collection. */
export function CollectionDragOverlay() {
	return (
		<DragOverlay>
			{source => (
				<div {...stylex.props(styles.row)}>
					<div {...stylex.props(styles.chip)}>
						{source.data.title}
					</div>
				</div>
			)}
		</DragOverlay>
	)
}
