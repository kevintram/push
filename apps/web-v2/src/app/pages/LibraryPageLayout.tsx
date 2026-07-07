import * as stylex from '@stylexjs/stylex'
import { Outlet } from '@tanstack/react-router'

import { LibrarySidebar } from '~/modules/library/components/library-sidebar/LibrarySidebar'

const styles = stylex.create({
	container: {
		display: 'flex',
		height: '100%',
	},
})

export function LibraryPageLayout() {
	return (
		<div {...stylex.props(styles.container)}>
			<LibrarySidebar />
			<Outlet />
		</div>
	)
}
