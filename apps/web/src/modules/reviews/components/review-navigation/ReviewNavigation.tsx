import * as stylex from '@stylexjs/stylex'
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
import { useReviewQueueCounts } from '~/modules/reviews/hooks/useReviewQueueCounts'
import { appSidebar } from '~/styles/tokens.stylex'
import { readStoredBoolean, writeStoredBoolean } from '~/utils/storage'

const REVIEW_NAVIGATION_STORAGE_KEY = 'reviewNavigationOpen'

const styles = stylex.create({
	items: {
		display: 'flex',
		flexDirection: 'column',
	},
	// Centers the dot in an icon-sized slot so it lines up with header actions.
	statusDotWrapper: {
		display: 'flex',
		inlineSize: appSidebar.iconSize,
		justifyContent: 'center',
		marginInlineStart: 'auto',
	},
})

export function ReviewNavigation() {
	const queues = useReviewQueueCounts()

	return (
		<SidebarCollapsibleItem
			defaultOpen={readStoredBoolean(REVIEW_NAVIGATION_STORAGE_KEY, true)}
			aria-label='Review'
			onOpenChange={open =>
				writeStoredBoolean(REVIEW_NAVIGATION_STORAGE_KEY, open)
			}
		>
			<SidebarCollapsibleHeader>
				<SidebarCollapsibleTrigger>Review</SidebarCollapsibleTrigger>
			</SidebarCollapsibleHeader>
			<SidebarCollapsibleContent
				render={<nav aria-label='review sections' />}
				xstyle={styles.items}
			>
				<SidebarItem
					ariaLabel={queues.due.countLabel}
					icon={Calendar}
					render={<Link to='/review/due' />}
				>
					Due
					{queues.due.count > 0 && (
						<span {...stylex.props(styles.statusDotWrapper)}>
							<StatusDot />
						</span>
					)}
				</SidebarItem>
				<SidebarItem
					ariaLabel={queues.new.countLabel}
					icon={Sparkles}
					render={<Link to='/review/new' />}
				>
					New
					{queues.new.count > 0 && (
						<span {...stylex.props(styles.statusDotWrapper)}>
							<StatusDot />
						</span>
					)}
				</SidebarItem>
				<SidebarItem
					ariaLabel={queues.late.countLabel}
					icon={BellRing}
					render={<Link to='/review/late' />}
				>
					Late
					{queues.late.count > 0 && (
						<span {...stylex.props(styles.statusDotWrapper)}>
							<StatusDot />
						</span>
					)}
				</SidebarItem>
				<SidebarItem
					ariaLabel={queues.flagged.countLabel}
					icon={Flag}
					render={<Link to='/review/flagged' />}
				>
					Flagged
					{queues.flagged.count > 0 && (
						<span {...stylex.props(styles.statusDotWrapper)}>
							<StatusDot />
						</span>
					)}
				</SidebarItem>
			</SidebarCollapsibleContent>
		</SidebarCollapsibleItem>
	)
}
