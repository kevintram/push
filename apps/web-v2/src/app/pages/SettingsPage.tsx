import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import { AccountSettingsSection } from './AccountSettingsSection'

const styles = stylex.create({
	container: {
		display: 'flex',
		justifyContent: 'center',
		minHeight: '100%',
		width: '100%',
	},
	content: {
		gap: spacing['4xl'],
		paddingBlock: spacing['3xl'],
		paddingInline: spacing['2xl'],

		alignContent: 'start',
		alignItems: 'start',
		display: 'grid',
		flexShrink: 1,
		justifyItems: 'start',
		maxWidth: '720px',
		minWidth: 0,
		width: '100%',
	},
	header: {
		gap: spacing.sm,
		display: 'grid',
	},
	title: {
		margin: 0,

		fontSize: '2rem',
		fontWeight: fontWeights.bold,
		letterSpacing: '-0.04em',
		lineHeight: 1.1,
	},
	description: {
		margin: 0,

		color: colors.textSecondary,
		fontSize: fontSizes.sm,
		lineHeight: 1.5,
	},
})

export function SettingsPage() {
	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<header {...stylex.props(styles.header)}>
					<h1 {...stylex.props(styles.title)}>Settings</h1>
					<p {...stylex.props(styles.description)}>
						Manage your account and app preferences.
					</p>
				</header>

				<AccountSettingsSection />
			</div>
		</div>
	)
}
