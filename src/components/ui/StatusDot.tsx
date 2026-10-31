import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'

export interface StatusDotProps {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	dot: {
		borderRadius: '50%',
		backgroundColor: colorsSemantic.textPrimary,
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
