import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { textFade } from '~/styles/textFade'
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
		backgroundColor: colorsSemantic.surfaceTransparent,
		color: {
			default: colorsSemantic.textInteractive,
			':hover': colorsSemantic.textInteractiveHover,
		},
		cursor: 'pointer',
		display: 'flex',
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		paddingInlineEnd: spacing.xs,
		paddingInlineStart: spacing.none,
		textAlign: 'start',
	},
	selected: {
		color: colorsSemantic.textInteractiveActive,
	},
})

export function TreeItemLabel({
	children,
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
			// The label keeps its focus ring, so only the text fades.
			{
				children: (
					<span {...stylex.props(textFade.line)}>{children}</span>
				),
			},
		),
		render,
		state: { slot: 'tree-item-label' },
	})
}
