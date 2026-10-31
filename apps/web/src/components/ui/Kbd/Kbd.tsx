import * as stylex from '@stylexjs/stylex'

import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

export interface KbdProps extends Omit<
	React.ComponentProps<'kbd'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	// Tinted from the surrounding text color, so a key reads the same on any
	// surface: a tooltip, a highlighted menu row, or an inverse toolbar.
	root: {
		paddingInline: spacing.xs,

		borderRadius: radii.xs,
		alignItems: 'center',
		backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)',
		blockSize: '20px',
		color: 'color-mix(in srgb, currentColor 75%, transparent)',
		columnGap: spacing.xs,
		display: 'inline-flex',
		fontFamily: 'inherit',
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
		inlineSize: 'fit-content',
		justifyContent: 'center',
		lineHeight: 1,
		minInlineSize: '20px',
		pointerEvents: 'none',
		userSelect: 'none',
		whiteSpace: 'nowrap',
	},
})

export function Kbd({ xstyle, ...props }: KbdProps) {
	return (
		<kbd
			data-slot='kbd'
			{...stylex.props(styles.root, xstyle)}
			{...props}
		/>
	)
}
