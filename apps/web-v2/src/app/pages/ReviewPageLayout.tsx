import * as stylex from '@stylexjs/stylex'
import { Outlet } from '@tanstack/react-router'

import { ReviewSidebar } from '~/modules/reviews/components/ReviewSidebar'
import {
	appShellColors,
	reviewSidebarColors,
} from '~/styles/colors/components.stylex'
import { layout, radii } from '~/styles/tokens.stylex'

const styles = stylex.create({
	layout: {
		overflow: 'auto',

		display: 'flex',
		flexDirection: 'row',

		height: '100%',

		backgroundColor: reviewSidebarColors.background,
	},
	main: {
		overflow: 'hidden',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',
		position: 'relative',
		zIndex: 1,
		minWidth: 0,

		backgroundColor: appShellColors.surfaceBackground,
		boxShadow: {
			default: 'none',
			'@media (min-width: 900px)': `-1px 0 4px ${appShellColors.surfaceShadow}`,
		},
		borderBottomLeftRadius: {
			default: 0,
			'@media (min-width: 900px)': radii.xl,
		},
		borderTopLeftRadius: {
			default: 0,
			'@media (min-width: 900px)': radii.xl,
		},
	},
	content: {
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		maxWidth: layout.contentMaxWidth,
		minWidth: 0,
		width: '100%',
	},
})

export function ReviewPageLayout() {
	return (
		<div {...stylex.props(styles.layout)}>
			<ReviewSidebar />
			<div {...stylex.props(styles.main)}>
				<div {...stylex.props(styles.content)}>
					<Outlet />
				</div>
			</div>
		</div>
	)
}
