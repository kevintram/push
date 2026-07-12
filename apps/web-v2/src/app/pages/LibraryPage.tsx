import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		padding: spacing.md,
		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
	},
})

export function LibraryPage() {
	return (
		<div {...stylex.props(styles.container)}>
			<h1>Library</h1>
		</div>
	)
}
