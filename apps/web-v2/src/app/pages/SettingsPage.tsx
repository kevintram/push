import * as stylex from '@stylexjs/stylex'
import * as v from 'valibot'

import { ContentColumn } from '~/components/ContentColumn'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'
import { apiFetch } from '~/utils/apiFetch'

const apiUrl = import.meta.env.VITE_API_URL

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
		<ContentColumn xstyle={styles.page}>
			<h1 {...stylex.props(styles.title)}>Settings</h1>
			<p {...stylex.props(styles.description)}>
				App settings will appear here.
			</p>
			<button onClick={handleLogin}>Log In</button>
			<button onClick={handleFetch}>Fetch</button>
		</ContentColumn>
	)
}
