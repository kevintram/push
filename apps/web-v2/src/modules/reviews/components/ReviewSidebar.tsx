import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { BellRing, Calendar, Sparkles } from 'lucide-react'

import { AppRailItem } from '~/components/app-rail-item'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		position: 'sticky',
		top: 0,

		padding: spacing.md,

		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
	},
})

export function ReviewSidebar() {
	return (
		<nav aria-label='review sections' {...stylex.props(styles.container)}>
			<AppRailItem
				icon={Calendar}
				layout='skinny'
				render={<Link to='/review/due' />}
				text='Due'
			/>
			<AppRailItem
				icon={Sparkles}
				layout='skinny'
				render={<Link to='/review/new' />}
				text='New'
			/>
			<AppRailItem
				icon={BellRing}
				layout='skinny'
				render={<Link to='/review/late' />}
				text='Late'
			/>
		</nav>
	)
}
