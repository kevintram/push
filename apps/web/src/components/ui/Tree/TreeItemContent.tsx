import * as stylex from '@stylexjs/stylex'

import { treeColors } from '~/styles/colors/components.stylex'
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
			':hover': treeColors.itemBackgroundHover,
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
			default: treeColors.itemBackgroundSelected,
			':hover': treeColors.itemBackgroundSelectedHover,
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
