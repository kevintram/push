import * as stylex from '@stylexjs/stylex'

import { ContentColumn } from '~/components/ContentColumn'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	page: {
		padding: spacing.xl,
		gap: spacing.sm,

		alignItems: 'start',
		display: 'grid',
		justifyItems: 'start',
	},
	title: {
		margin: 0,

		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
	},
	description: {
		margin: 0,

		color: colors.textSecondary,
		fontSize: fontSizes.md,
		lineHeight: 1.5,
	},
})

export function SettingsPage() {
	return (
		<ContentColumn xstyle={styles.page}>
			<h1 {...stylex.props(styles.title)}>Settings</h1>
			<p {...stylex.props(styles.description)}>
				App settings will appear here.
			</p>
		</ContentColumn>
	)
}
