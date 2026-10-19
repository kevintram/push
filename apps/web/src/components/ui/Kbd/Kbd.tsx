import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

export interface KbdProps extends Omit<
	React.ComponentProps<'kbd'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	root: {
		paddingInline: spacing.xs,

		borderRadius: radii.xs,
		alignItems: 'center',
		backgroundColor: semanticColors.surfaceRaised,
		blockSize: '20px',
		color: semanticColors.textSecondary,
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
