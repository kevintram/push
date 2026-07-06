import * as stylex from '@stylexjs/stylex'
import { BellRing, Calendar, ListChecks, Sparkles } from 'lucide-react'

import { SidebarLink } from '~/components/sidebar-link'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.xs,
		padding: spacing.md,
	},
})

export function ReviewSidebar() {
	return (
		<nav aria-label='review sections' {...stylex.props(styles.container)}>
			<SidebarLink
				icon={Calendar}
				text='Due'
				to='/review/due'
				variant='skinny'
			/>
			<SidebarLink
				icon={Sparkles}
				text='New'
				to='/review/new'
				variant='skinny'
			/>
			<SidebarLink
				icon={BellRing}
				text='Late'
				to='/review/late'
				variant='skinny'
			/>
			<SidebarLink
				icon={ListChecks}
				text='Completed'
				to='/review/completed'
				variant='skinny'
			/>
		</nav>
	)
}
