import * as stylex from '@stylexjs/stylex'

import { fontSizes, fontWeights, layout, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		display: 'flex',
		justifyContent: 'center',
		minHeight: '100%',
		width: '100%',
	},
	content: {
		padding: spacing.xl,

		display: 'grid',
		flexShrink: 1,
		maxWidth: layout.contentMaxWidth,
		minHeight: '100%',
		minWidth: 0,
		width: '100%',
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
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<section {...stylex.props(styles.hero)}>
					<p {...stylex.props(styles.eyebrow)}>3gulp v2</p>
					<h1 {...stylex.props(styles.title)}>
						A clean foundation for the rewrite.
					</h1>
				</section>
			</div>
		</div>
	)
}
