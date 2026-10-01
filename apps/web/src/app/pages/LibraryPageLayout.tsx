import * as stylex from '@stylexjs/stylex'
import { Outlet } from '@tanstack/react-router'

const styles = stylex.create({
	container: {
		overflow: 'hidden',
		display: 'flex',

		height: '100%',
	},
	content: {
		display: 'flex',
		flexDirection: 'column',

		overflow: 'hidden',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,
	},
})

export function LibraryPageLayout() {
	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<Outlet />
			</div>
		</div>
	)
}
