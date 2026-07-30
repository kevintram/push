import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
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
		gap: spacing.sm,

		alignItems: 'start',
		display: 'grid',
		flexShrink: 1,
		justifyItems: 'start',
		maxWidth: layout.contentMaxWidth,
		minWidth: 0,
		width: '100%',
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
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<h1 {...stylex.props(styles.title)}>Settings</h1>
				<p {...stylex.props(styles.description)}>
					App settings will appear here.
				</p>
			</div>
		</div>
	)
}
