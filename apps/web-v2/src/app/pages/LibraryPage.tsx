import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
	},
})

const apiUrl = import.meta.env.VITE_API_URL

export function LibraryPage() {
	const handleLogin = async () => {
		console.log('logging in!')
		const loginUrl = apiUrl + '/login'
		window.location.replace(loginUrl)
	}

	const handleFetch = async () => {
		console.log('fetching!')
		const reviewsUrl = apiUrl + '/reviews'
		const res = await fetch(reviewsUrl, {
			credentials: 'include',
		})
		const data = await res.json()
		console.log(data)
	}

	return (
		<div {...stylex.props(styles.container)}>
			<h1>Library</h1>
			<button onClick={() => handleLogin()}>Log In</button>
			<button onClick={() => handleFetch()}>Fetch</button>
		</div>
	)
}
