import * as stylex from '@stylexjs/stylex'
import { BookOpen, Clock, Flag, Library, PinIcon, Settings } from 'lucide-react'

import { colors, spacing } from '~/styles/tokens.stylex'

import { SidebarLink } from './sidebar-link'

const styles = stylex.create({
	container: {
		padding: spacing.lg,
		gap: spacing.lg,

		borderInlineEndColor: colors.border,
		borderInlineEndStyle: 'solid',
		borderInlineEndWidth: '1px',

		display: 'flex',
		flexDirection: 'column',
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
