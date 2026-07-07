import * as stylex from '@stylexjs/stylex'
import { BookOpen, Clock, Flag, Library, PinIcon, Settings } from 'lucide-react'

import { colors, spacing } from '~/styles/tokens.stylex'

import { SidebarLink } from './sidebar-link'

const styles = stylex.create({
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.lg,

		padding: spacing.lg,

		borderInlineEndWidth: '1px',
		borderInlineEndStyle: 'solid',
		borderInlineEndColor: colors.border,
	},
	spacer: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
	},
})

export function AppSidebar() {
	return (
		<nav aria-label='primary' {...stylex.props(styles.container)}>
			<SidebarLink icon={BookOpen} text='Review' to='/review' />
			<SidebarLink icon={Flag} text='Flagged' to='/flagged' />
			<SidebarLink icon={Clock} text='Recent' to='/recent' />
			<SidebarLink icon={PinIcon} text='Pinned' to='/pinned' />
			<SidebarLink icon={Library} text='Library' to='/library' />
			<div {...stylex.props(styles.spacer)} />
			<SidebarLink ariaLabel='Settings' icon={Settings} to='/settings' />
		</nav>
	)
}
