import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'

export interface StatusDotProps {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	dot: {
		borderRadius: '50%',
		backgroundColor: semanticColors.textPrimary,
		blockSize: '6px',
		flexShrink: 0,
		inlineSize: '6px',
	},
})

export function StatusDot({ xstyle }: StatusDotProps) {
	return (
		<span
			aria-hidden='true'
			data-slot='status-dot'
			{...stylex.props(styles.dot, xstyle)}
		/>
	)
}
