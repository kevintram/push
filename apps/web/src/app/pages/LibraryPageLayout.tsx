import * as stylex from '@stylexjs/stylex'
import { Outlet } from '@tanstack/react-router'

import { LibrarySidebar } from '~/modules/library/components/library-sidebar/LibrarySidebar'
import {
	appShellColors,
	librarySidebarColors,
} from '~/styles/colors/components.stylex'
import { breakpoints, radii } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		overflow: 'hidden',
		display: 'flex',

		height: '100%',

		backgroundColor: librarySidebarColors.background,
	},
	content: {
		display: 'flex',
		flexDirection: 'column',

		overflow: 'hidden',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		position: 'relative',
		zIndex: 1,
		minWidth: 0,

		backgroundColor: appShellColors.surfaceBackground,
		boxShadow: {
			default: 'none',
			[breakpoints.tablet]: `-1px 0 4px ${appShellColors.surfaceShadow}`,
		},
		borderBottomLeftRadius: {
			default: 0,
			[breakpoints.tablet]: radii.xl,
		},
		borderTopLeftRadius: {
			default: 0,
			[breakpoints.tablet]: radii.xl,
		},
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
