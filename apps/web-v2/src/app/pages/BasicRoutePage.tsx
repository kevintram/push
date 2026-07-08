import * as stylex from '@stylexjs/stylex'

import { colors, fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

type BasicRoutePageProps = {
	description: string
	title: string
}

const styles = stylex.create({
	page: {
		padding: spacing.xl,
		gap: spacing.md,
		alignContent: 'start',
		display: 'grid',
		minHeight: '100%',
	},
	title: {
		margin: 0,
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
		letterSpacing: 0,
	},
	description: {
		margin: 0,
		color: colors.mutedForeground,
		fontSize: fontSizes.md,
		lineHeight: 1.5,
		maxWidth: '52ch',
	},
})

export function BasicRoutePage({ description, title }: BasicRoutePageProps) {
	return (
		<main {...stylex.props(styles.page)}>
			<h1 {...stylex.props(styles.title)}>{title}</h1>
			<p {...stylex.props(styles.description)}>{description}</p>
		</main>
	)
}
