import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
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
		borderWidth: 0,
		paddingBlock: 0,
		textDecoration: 'none',
		alignItems: 'center',
		// Fills the row so the whole row height is clickable.
		alignSelf: 'stretch',
		backgroundColor: semanticColors.surfaceTransparent,
		color: {
			default: semanticColors.textInteractive,
			':hover': semanticColors.textInteractiveHover,
		},
		cursor: 'pointer',
		display: 'flex',
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		outlineColor: {
			default: semanticColors.surfaceTransparent,
			':focus-visible': semanticColors.borderFocus,
		},
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		paddingInlineEnd: spacing.xs,
		paddingInlineStart: spacing.none,
		textAlign: 'start',
	},
	selected: {
		color: semanticColors.textInteractiveActive,
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
