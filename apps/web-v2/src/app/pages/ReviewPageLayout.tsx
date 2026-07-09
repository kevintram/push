import * as stylex from '@stylexjs/stylex'
import { Outlet } from '@tanstack/react-router'

import { ReviewSidebar } from '~/modules/reviews/components/ReviewSidebar'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	outerContainer: {
		overflow: 'hidden',

		display: 'flex',
		flexDirection: 'row',

		height: '100%',
	},
	innerContainer: {
		padding: spacing.xl,

		overflow: 'auto',

		display: 'flex',
		flexBasis: 0,
		flexDirection: 'column',
		flexGrow: 1,
		flexShrink: 1,
	},
})

export function ReviewPageLayout() {
	return (
		<div {...stylex.props(styles.outerContainer)}>
			<ReviewSidebar />
			<div {...stylex.props(styles.innerContainer)}>
				<Outlet />
			</div>
		</div>
	)
}
