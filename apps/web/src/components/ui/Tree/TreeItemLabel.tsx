import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { treeColors } from '~/styles/colors/components.stylex'
import { fontSizes, spacing } from '~/styles/tokens.stylex'

import { useTreeItemContext } from './TreeItemContext'

export interface TreeItemLabelProps extends Omit<
	useRender.ComponentProps<'button'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	label: {
		padding: spacing.xs,
		borderWidth: 0,
		textDecoration: 'none',
		alignItems: 'center',
		backgroundColor: treeColors.labelBackground,
		color: {
			default: treeColors.labelForeground,
			':hover': treeColors.labelForegroundHover,
		},
		cursor: 'pointer',
		display: 'flex',
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		outlineColor: {
			default: treeColors.labelFocusRingRest,
			':focus-visible': treeColors.labelFocusRing,
		},
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		textAlign: 'start',
	},
	selected: {
		color: treeColors.labelForegroundSelected,
	},
})

export function TreeItemLabel({
	render,
	xstyle,
	...props
}: TreeItemLabelProps) {
	const { selected } = useTreeItemContext()

	return useRender({
		defaultTagName: 'button',
		props: mergeProps<'button'>(
			{ type: render ? undefined : 'button' },
			stylex.props(styles.label, selected && styles.selected, xstyle),
			props,
		),
		render,
		state: { slot: 'tree-item-label' },
	})
}
