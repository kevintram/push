import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fontSizes, fontWeights } from '~/styles/tokens.stylex'

const styles = stylex.create({
	count: {
		color: semanticColors.textTertiary,
		fontSize: fontSizes.xs,
		fontVariantNumeric: 'tabular-nums',
		fontWeight: fontWeights.semibold,
		marginInlineStart: 'auto',
	},
})

export function QueueCount({ count }: { count: number }) {
	if (count === 0) return null
	return (
		<span data-slot='queue-count' {...stylex.props(styles.count)}>
			{count}
		</span>
	)
}
