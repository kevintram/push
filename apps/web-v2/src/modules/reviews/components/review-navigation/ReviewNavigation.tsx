import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BellRing, Calendar, Flag, Sparkles } from 'lucide-react'

import {
	SidebarCollapsibleContent,
	SidebarCollapsibleHeader,
	SidebarCollapsibleItem,
	SidebarCollapsibleTrigger,
	SidebarItem,
} from '~/components/sidebar'
import { StatusDot } from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	items: {
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

export function ReviewNavigation() {
	const today = useToday()
	// TODO(3): Replace these full-list subscriptions with count or exists queries.
	// TODO(2): Handle query errors instead of showing missing status dots as empty queues.
	const { data: dueEntries } = useQuery(dueQueries.listDue(today))
	const { data: newEntries } = useQuery(dueQueries.listNew())
	const { data: lateEntries } = useQuery(dueQueries.listLate(today))
	const { data: flaggedCards } = useQuery(cardQueries.listFlagged())

	const hasDue = (dueEntries?.length ?? 0) > 0
	const hasNew = (newEntries?.length ?? 0) > 0
	const hasLate = (lateEntries?.length ?? 0) > 0
	const hasFlagged = (flaggedCards?.length ?? 0) > 0

	return (
		<SidebarCollapsibleItem defaultOpen aria-label='Review'>
			<SidebarCollapsibleHeader>
				<SidebarCollapsibleTrigger>Review</SidebarCollapsibleTrigger>
			</SidebarCollapsibleHeader>
			<SidebarCollapsibleContent
				render={<nav aria-label='review sections' />}
				xstyle={styles.items}
			>
				<SidebarItem
					ariaLabel={hasDue ? 'Due, cards available' : undefined}
					icon={Calendar}
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
					render={<Link to='/review/late' />}
				>
					Late
					{hasLate && (
						<span {...stylex.props(styles.statusDotWrapper)}>
							<StatusDot />
						</span>
					)}
				</SidebarItem>
				<SidebarItem
					ariaLabel={
						hasFlagged ? 'Flagged, cards available' : undefined
					}
					icon={Flag}
					render={<Link to='/review/flagged' />}
				>
					Flagged
					{hasFlagged && (
						<span {...stylex.props(styles.statusDotWrapper)}>
							<StatusDot />
						</span>
					)}
				</SidebarItem>
			</SidebarCollapsibleContent>
		</SidebarCollapsibleItem>
	)
}
