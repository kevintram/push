import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
	},
})

export function LibraryPage() {
	const handleLogin = async () => {
		console.log('logging in!')
		window.location.replace('http://localhost:8000/login')
	}

	const handleFetch = async () => {
		console.log('fetching!')
		const res = await fetch('http://localhost:8000/reviews', {
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
