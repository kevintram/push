import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { BookOpen, Clock, Flag, Library, PinIcon, Settings } from 'lucide-react'

import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { SearchDialogTrigger } from '~/modules/search/components/SearchDialogTrigger'
import { appRailColors } from '~/styles/colors/components.stylex'
import { spacing } from '~/styles/tokens.stylex'

import { AppRailItem } from './app-rail-item'

const styles = stylex.create({
	container: {
		padding: spacing.sm,
		gap: spacing.xs,

		backgroundColor: appRailColors.background,

		borderInlineEndColor: appRailColors.border,
		borderInlineEndStyle: 'solid',
		borderInlineEndWidth: '1px',

		display: 'flex',
		flexDirection: 'column',

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
			<AppRailItem
				icon={BookOpen}
				render={<Link to='/review' />}
				text='Review'
			/>
			<AppRailItem
				icon={Flag}
				render={<Link to='/flagged' />}
				text='Flagged'
			/>
			<AppRailItem
				icon={Clock}
				render={<Link to='/recent' />}
				text='Recent'
			/>
			<AppRailItem
				icon={PinIcon}
				render={<Link to='/pinned' />}
				text='Pinned'
			/>
			<AppRailItem
				icon={Library}
				render={<Link to='/library' />}
				text='Library'
			/>
			<div {...stylex.props(styles.spacer)} />
			<HideModeButton />
			<AppRailItem
				icon={Settings}
				render={<Link to='/settings' />}
				text='Settings'
			/>
		</nav>
	)
}
