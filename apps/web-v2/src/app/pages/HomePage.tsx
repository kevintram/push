import * as stylex from '@stylexjs/stylex'

import { ContentColumn } from '~/components/ContentColumn'
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
		width: '100%',
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
		<ContentColumn xstyle={styles.page}>
			<section {...stylex.props(styles.hero)}>
				<p {...stylex.props(styles.eyebrow)}>3gulp v2</p>
				<h1 {...stylex.props(styles.title)}>
					A clean foundation for the rewrite.
				</h1>
			</section>
		</ContentColumn>
	)
}
