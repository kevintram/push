import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import {
	SidebarCollapsibleContent,
	SidebarCollapsibleHeader,
	SidebarCollapsibleItem,
	SidebarCollapsibleTrigger,
	SidebarItem,
} from '~/components/sidebar'
import { useReviewQueueCounts } from '~/modules/reviews/hooks/useReviewQueueCounts'
import { REVIEW_LINKS } from '~/modules/reviews/reviewLinks'
import { readStoredBoolean, writeStoredBoolean } from '~/utils/storage'

import { QueueCount } from './QueueCount'

const REVIEW_NAVIGATION_STORAGE_KEY = 'reviewNavigationOpen'

const styles = stylex.create({
	items: {
		display: 'flex',
		flexDirection: 'column',
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
						<QueueCount count={queues[queueKey].count} />
					</SidebarItem>
				))}
			</SidebarCollapsibleContent>
		</SidebarCollapsibleItem>
	)
}
