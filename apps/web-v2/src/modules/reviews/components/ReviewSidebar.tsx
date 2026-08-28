import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { BellRing, Calendar, Sparkles } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar-item'
import { reviewSidebarColors } from '~/styles/colors/components.stylex'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		position: 'sticky',
		top: 0,

		padding: spacing.sm,
		minInlineSize: '180px',

		backgroundColor: reviewSidebarColors.background,

		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
	},
})

export function ReviewSidebar() {
	return (
		<nav aria-label='review sections' {...stylex.props(styles.container)}>
			<SidebarItem
				icon={Calendar}
				layout='skinny'
				render={<Link to='/review/due' />}
				text='Due'
			/>
			<SidebarItem
				icon={Sparkles}
				layout='skinny'
				render={<Link to='/review/new' />}
				text='New'
			/>
			<SidebarItem
				icon={BellRing}
				layout='skinny'
				render={<Link to='/review/late' />}
				text='Late'
			/>
		</nav>
	)
}
