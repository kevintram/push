import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
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
			':hover': colors.navBgSurfaceHover,
		},
		display: 'grid',
		gridTemplateColumns: '26px minmax(0, 1fr)',
	},
	selected: {
		backgroundColor: {
			default: colors.navBgSurfaceActive,
			':hover': colors.navBgSurfaceActive,
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
