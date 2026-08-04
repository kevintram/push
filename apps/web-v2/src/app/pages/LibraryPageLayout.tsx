import * as stylex from '@stylexjs/stylex'
import { Outlet } from '@tanstack/react-router'

import { LibrarySidebar } from '~/modules/library/components/library-sidebar/LibrarySidebar'

const styles = stylex.create({
	container: {
		overflow: 'hidden',
		display: 'flex',

		height: '100%',
	},
	content: {
		display: 'flex',
		flexDirection: 'column',

		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,
	},
})

export function LibraryPageLayout() {
	return (
		<div {...stylex.props(styles.container)}>
			<LibrarySidebar />
			<div {...stylex.props(styles.content)}>
				<Outlet />
			</div>
		</div>
	)
}
