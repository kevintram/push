import * as stylex from '@stylexjs/stylex'

import { ContentColumn } from '~/components/ContentColumn'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

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

		color: colors.textSecondary,
		fontSize: fontSizes.md,
		lineHeight: 1.5,
		maxWidth: '52ch',
	},
})

export function BasicRoutePage({ description, title }: BasicRoutePageProps) {
	return (
		<ContentColumn xstyle={styles.page}>
			<h1 {...stylex.props(styles.title)}>{title}</h1>
			<p {...stylex.props(styles.description)}>{description}</p>
		</ContentColumn>
	)
}
