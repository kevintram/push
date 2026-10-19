import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { appSidebar, radii, spacing } from '~/styles/tokens.stylex'

import { useTreeItemContext } from './TreeItemContext'

export interface TreeItemContentProps extends Omit<
	React.ComponentProps<'div'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	content: {
		borderRadius: radii.md,
		gap: spacing.sm,
		alignItems: 'center',
		backgroundColor: {
			default: 'inherit',
			':hover': semanticColors.surfaceTransparentHover,
		},
		display: 'grid',
		gridTemplateColumns: `${appSidebar.iconSize} minmax(0, 1fr)`,
		// Rows sit flush at the sidebar row height, with the leading icon at the
		// sidebar row inset.
		minBlockSize: appSidebar.rowHeight,
		paddingInlineStart: appSidebar.rowInset,
	},
	selected: {
		backgroundColor: {
			default: semanticColors.surfaceTransparentActive,
			':hover': semanticColors.surfaceTransparentActive,
		},
	},
})

export function TreeItemContent({ xstyle, ...props }: TreeItemContentProps) {
	const { selected } = useTreeItemContext()

	return (
		<div
			data-slot='tree-item-content'
			data-selected={selected ? '' : undefined}
			{...stylex.props(
				styles.content,
				selected && styles.selected,
				xstyle,
			)}
			{...props}
		/>
	)
}
