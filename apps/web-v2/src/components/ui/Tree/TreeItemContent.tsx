import * as stylex from '@stylexjs/stylex'

import { treeColors } from '~/styles/colors/components.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

import { useTreeItemContext } from './TreeItemContext'

export interface TreeItemContentProps extends Omit<
	React.ComponentProps<'div'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	content: {
		borderRadius: radii.lg,
		gap: spacing.xs,
		alignItems: 'center',
		backgroundColor: {
			default: 'inherit',
			':hover': treeColors.itemBackgroundHover,
		},
		display: 'grid',
		gridTemplateColumns: '26px minmax(0, 1fr)',
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
