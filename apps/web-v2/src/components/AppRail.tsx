import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { BookOpen, Clock, Flag, Library, PinIcon, Settings } from 'lucide-react'

import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { SearchDialogTrigger } from '~/modules/search/components/SearchDialogTrigger'
import { appRailColors } from '~/styles/colors/components.stylex'
import { spacing } from '~/styles/tokens.stylex'

import { SidebarItem } from './sidebar-item'

const styles = stylex.create({
	container: {
		padding: spacing.sm,
		gap: spacing.sm,

		backgroundColor: appRailColors.background,

		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,

		inlineSize: '85px',
	},
	spacer: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
})

export function AppRail() {
	return (
		<nav aria-label='primary' {...stylex.props(styles.container)}>
			<SearchDialogTrigger />
			<SidebarItem
				icon={BookOpen}
				render={<Link to='/review' />}
				text='Review'
			/>
			<SidebarItem
				icon={Flag}
				render={<Link to='/flagged' />}
				text='Flagged'
			/>
			<SidebarItem
				icon={Clock}
				render={<Link to='/recent' />}
				text='Recent'
			/>
			<SidebarItem
				icon={PinIcon}
				render={<Link to='/pinned' />}
				text='Pinned'
			/>
			<SidebarItem
				icon={Library}
				render={<Link to='/library' />}
				text='Library'
			/>
			<div {...stylex.props(styles.spacer)} />
			<HideModeButton />
			<SidebarItem
				icon={Settings}
				render={<Link to='/settings' />}
				text='Settings'
			/>
		</nav>
	)
}
