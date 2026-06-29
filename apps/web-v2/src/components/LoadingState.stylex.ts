import * as stylex from '@stylexjs/stylex'

import { colors, spacing } from '../styles/theme.stylex'

const spin = stylex.keyframes({
	to: {
		transform: 'rotate(360deg)',
	},
})

export const styles = stylex.create({
	root: {
		minHeight: '100%',
		display: 'grid',
		placeItems: 'center',
		gap: spacing.three,
		color: colors.mutedForeground,
	},
	spinner: {
		width: 20,
		height: 20,
		borderRadius: '50%',
		borderWidth: 2,
		borderStyle: 'solid',
		borderColor: colors.border,
		borderTopColor: colors.foreground,
		animationName: spin,
		animationDuration: '750ms',
		animationTimingFunction: 'linear',
		animationIterationCount: 'infinite',
	},
})
