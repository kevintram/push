import * as stylex from '@stylexjs/stylex'
import { Loader } from 'lucide-react'

import { colors } from '~/styles/colors.stylex'
import { iconSizes } from '~/styles/tokens.stylex'

const spin = stylex.keyframes({
	to: {
		transform: 'rotate(360deg)',
	},
})

const styles = stylex.create({
	page: {
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',

		flexBasis: 0,
		flexGrow: 1,
		minHeight: '100%',
	},
	loader: {
		animationDuration: '1s',
		animationIterationCount: 'infinite',
		animationName: spin,
		animationTimingFunction: 'linear',
		color: colors.textSecondary,
		height: iconSizes.xl,
		width: iconSizes.xl,
	},
})

export function LoaderPage() {
	return (
		<div aria-label='Loading' role='status' {...stylex.props(styles.page)}>
			<Loader aria-hidden='true' {...stylex.props(styles.loader)} />
		</div>
	)
}
