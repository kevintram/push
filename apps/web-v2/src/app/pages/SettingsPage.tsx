import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const apiUrl = import.meta.env.VITE_API_URL

const styles = stylex.create({
	page: {
		padding: spacing.xl,
		gap: spacing.sm,

		alignItems: 'start',
		display: 'grid',
		width: 'fit-content',
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
		console.log('logging in!')
		window.location.replace(`${apiUrl}/login`)
	}

	const handleFetch = async () => {
		console.log('fetching!')
		const response = await fetch(`${apiUrl}/reviews`, {
			credentials: 'include',
		})
		const data = await response.json()
		console.log(data)
	}

	return (
		<main {...stylex.props(styles.page)}>
			<h1 {...stylex.props(styles.title)}>Settings</h1>
			<p {...stylex.props(styles.description)}>
				App settings will appear here.
			</p>
			<button onClick={handleLogin}>Log In</button>
			<button onClick={handleFetch}>Fetch</button>
		</main>
	)
}
