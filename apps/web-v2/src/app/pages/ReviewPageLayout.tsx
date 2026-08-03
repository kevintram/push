import * as stylex from '@stylexjs/stylex'
import { Outlet } from '@tanstack/react-router'

import { ReviewSidebar } from '~/modules/reviews'
import { layout } from '~/styles/tokens.stylex'

const styles = stylex.create({
	layout: {
		overflow: 'auto',

		display: 'flex',
		flexDirection: 'row',

		height: '100%',
	},
	main: {
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',
		minWidth: 0,
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
