import * as stylex from '@stylexjs/stylex'
import { Loader } from 'lucide-react'

import { loadingIndicatorColors } from '~/styles/colors/components.stylex'
import { graphicSizes } from '~/styles/tokens.stylex'

const spin = stylex.keyframes({
	to: {
		transform: 'rotate(360deg)',
	},
})

const styles = stylex.create({
	container: {
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
		color: loadingIndicatorColors.foreground,
		height: graphicSizes.md,
		width: graphicSizes.md,
	},
})

/** Fills the space it is given and centres a spinner in it. */
export function LoadingIndicator() {
	return (
		<div
			aria-label='Loading'
			role='status'
			{...stylex.props(styles.container)}
		>
			<Loader aria-hidden='true' {...stylex.props(styles.loader)} />
		</div>
	)
}
