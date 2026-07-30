import * as stylex from '@stylexjs/stylex'
import * as v from 'valibot'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, layout, spacing } from '~/styles/tokens.stylex'
import { apiFetch } from '~/utils/apiFetch'

const apiUrl = import.meta.env.VITE_API_URL

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
	const handleLogin = () => {
		const url = new URL(`${apiUrl}/login`)
		url.searchParams.set('return_to', window.location.href)

		window.location.replace(url)
	}

	const handleFetch = async () => {
		const data = await apiFetch(v.unknown(), '/reviews/')
		console.log(data)
	}

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<h1 {...stylex.props(styles.title)}>Settings</h1>
				<p {...stylex.props(styles.description)}>
					App settings will appear here.
				</p>
				<button onClick={handleLogin}>Log In</button>
				<button onClick={handleFetch}>Fetch</button>
			</div>
		</div>
	)
}
