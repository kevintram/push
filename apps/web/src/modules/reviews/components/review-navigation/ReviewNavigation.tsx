import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import {
	SidebarCollapsibleContent,
	SidebarCollapsibleHeader,
	SidebarCollapsibleItem,
	SidebarCollapsibleTrigger,
	SidebarItem,
} from '~/components/sidebar'
import { StatusDot } from '~/components/ui'
import { useReviewQueueCounts } from '~/modules/reviews/hooks/useReviewQueueCounts'
import { REVIEW_LINKS } from '~/modules/reviews/reviewLinks'
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
				{REVIEW_LINKS.map(({ icon, label, queueKey, to }) => (
					<SidebarItem
						key={to}
						ariaLabel={queues[queueKey].countLabel}
						icon={icon}
						render={<Link to={to} />}
					>
						{label}
						{queues[queueKey].count > 0 && (
							<span {...stylex.props(styles.statusDotWrapper)}>
								<StatusDot />
							</span>
						)}
					</SidebarItem>
				))}
			</SidebarCollapsibleContent>
		</SidebarCollapsibleItem>
	)
}
