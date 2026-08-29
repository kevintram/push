import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { BookOpen, Flag, Library, Settings } from 'lucide-react'

import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { SearchDialog } from '~/modules/search/components/SearchDialog'
import { appRailColors } from '~/styles/colors/components.stylex'
import { spacing } from '~/styles/tokens.stylex'

import { SidebarItem } from './sidebar-item'

const styles = stylex.create({
	container: {
		padding: spacing.xs,
		gap: spacing.xs,

		backgroundColor: appRailColors.background,

		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,

		inlineSize: '75px',
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
			<SearchDialog />
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
