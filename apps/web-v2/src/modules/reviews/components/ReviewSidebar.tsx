import * as stylex from '@stylexjs/stylex'
import { queryOptions, useSuspenseQueries } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BellRing, Calendar, Sparkles } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar-item'
import { StatusDot } from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
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
	statusDotWrapper: {
		paddingInline: spacing.sm,
		display: 'flex',
		marginInlineStart: 'auto',
	},
})

export function ReviewSidebar() {
	const today = useToday()
	const [dueQuery, newQuery, lateQuery] = useSuspenseQueries({
		queries: [
			queryOptions(dueQueries.listDue(today)),
			queryOptions(dueQueries.listNew()),
			queryOptions(dueQueries.listLate(today)),
		],
	})
	const hasDue = dueQuery.data.length > 0
	const hasNew = newQuery.data.length > 0
	const hasLate = lateQuery.data.length > 0

	return (
		<nav aria-label='review sections' {...stylex.props(styles.container)}>
			<SidebarItem
				ariaLabel={hasDue ? 'Due, cards available' : undefined}
				icon={Calendar}
				layout='skinny'
				render={<Link to='/review/due' />}
			>
				Due
				{hasDue && (
					<span {...stylex.props(styles.statusDotWrapper)}>
						<StatusDot />
					</span>
				)}
			</SidebarItem>
			<SidebarItem
				ariaLabel={hasNew ? 'New, cards available' : undefined}
				icon={Sparkles}
				layout='skinny'
				render={<Link to='/review/new' />}
			>
				New
				{hasNew && (
					<span {...stylex.props(styles.statusDotWrapper)}>
						<StatusDot />
					</span>
				)}
			</SidebarItem>
			<SidebarItem
				ariaLabel={hasLate ? 'Late, cards available' : undefined}
				icon={BellRing}
				layout='skinny'
				render={<Link to='/review/late' />}
			>
				Late
				{hasLate && (
					<span {...stylex.props(styles.statusDotWrapper)}>
						<StatusDot />
					</span>
				)}
			</SidebarItem>
		</nav>
	)
}
