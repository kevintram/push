import * as stylex from '@stylexjs/stylex'

import { fontSizes, fontWeights, spacing } from '../../styles/theme.stylex'

const styles = stylex.create({
	page: {
		minHeight: '100%',
		padding: spacing.xl,
		display: 'grid',
		alignItems: 'center',
	},
	hero: {
		width: 'min(100%, 760px)',
		display: 'flex',
		flexDirection: 'column',
		gap: spacing['2xl'],
	},
	eyebrow: {
		margin: 0,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.bold,
		letterSpacing: 0,
	},
	title: {
		margin: 0,
		maxWidth: '18ch',
		fontSize: '3rem',
		fontWeight: fontWeights.bold,
		letterSpacing: 0,
		lineHeight: 0.95,
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
