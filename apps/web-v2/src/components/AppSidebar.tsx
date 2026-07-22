import * as stylex from '@stylexjs/stylex'
import { BookOpen, Clock, Flag, Library, PinIcon, Settings } from 'lucide-react'

import { colors } from '~/styles/colors.stylex'
import { spacing } from '~/styles/tokens.stylex'

import { ReviewModeItem } from './ReviewModeItem'
import { SidebarLink } from './sidebar-link'

const styles = stylex.create({
	container: {
		padding: spacing.sm,
		gap: spacing.xs,

		backgroundColor: colors.navBg,

		borderInlineEndColor: colors.borderSecondary,
		borderInlineEndStyle: 'solid',
		borderInlineEndWidth: '1px',

		display: 'flex',
		flexDirection: 'column',

		maxInlineSize: '80px',
	},
	spacer: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
})

export function AppSidebar() {
	return (
		<nav aria-label='primary' {...stylex.props(styles.container)}>
			<SidebarLink.Fat icon={BookOpen} text='Review' to='/review' />
			<SidebarLink.Fat icon={Flag} text='Flagged' to='/flagged' />
			<SidebarLink.Fat icon={Clock} text='Recent' to='/recent' />
			<SidebarLink.Fat icon={PinIcon} text='Pinned' to='/pinned' />
			<SidebarLink.Fat icon={Library} text='Library' to='/library' />
			<div {...stylex.props(styles.spacer)} />
			<ReviewModeItem />
			<SidebarLink.Fat
				ariaLabel='Settings'
				icon={Settings}
				to='/settings'
			/>
		</nav>
	)
}
