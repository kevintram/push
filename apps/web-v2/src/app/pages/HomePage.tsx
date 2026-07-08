import * as stylex from '@stylexjs/stylex'

import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	page: {
		padding: spacing.xl,

		display: 'grid',
		minHeight: '100%',
	},
	hero: {
		gap: spacing['2xl'],

		display: 'flex',
		flexDirection: 'column',
		width: 'min(100%, 760px)',
	},
	eyebrow: {
		margin: 0,

		fontSize: fontSizes.sm,
		fontWeight: fontWeights.bold,
		letterSpacing: 0,
	},
	title: {
		margin: 0,

		fontSize: '3rem',
		fontWeight: fontWeights.bold,
		letterSpacing: 0,
		lineHeight: 0.95,
		maxWidth: '18ch',
	},
})

export function HomePage() {
	return (
		<main {...stylex.props(styles.page)}>
			<section {...stylex.props(styles.hero)}>
				<p {...stylex.props(styles.eyebrow)}>3gulp v2</p>
				<h1 {...stylex.props(styles.title)}>
					A clean foundation for the rewrite.
				</h1>
			</section>
		</main>
	)
}
