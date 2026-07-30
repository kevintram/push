import * as stylex from '@stylexjs/stylex'
import { BellRing, Calendar, Sparkles } from 'lucide-react'

import { SidebarLink } from '~/components/sidebar-link'
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
			<SidebarLink icon={Calendar} text='Due' to='/review/due' />
			<SidebarLink icon={Sparkles} text='New' to='/review/new' />
			<SidebarLink icon={BellRing} text='Late' to='/review/late' />
		</nav>
	)
}
