import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import {
	SidebarCollapsibleContent,
	SidebarCollapsibleHeader,
	SidebarCollapsibleItem,
	SidebarCollapsibleTrigger,
	SidebarItem,
} from '~/components/sidebar'
import { usePersistedBoolean } from '~/hooks/usePersistedBoolean'
import { useReviewQueueCounts } from '~/modules/reviews/hooks/useReviewQueueCounts'
import { REVIEW_LINKS } from '~/modules/reviews/reviewLinks'

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
	const [isOpen, setIsOpen] = usePersistedBoolean(
		REVIEW_NAVIGATION_STORAGE_KEY,
		true,
	)

	return (
		<SidebarCollapsibleItem
			open={isOpen}
			aria-label='Review'
			onOpenChange={setIsOpen}
		>
			<SidebarCollapsibleHeader>
				<SidebarCollapsibleTrigger>Review</SidebarCollapsibleTrigger>
			</SidebarCollapsibleHeader>
			<SidebarCollapsibleContent
				render={<nav aria-label='Review sections' />}
				xstyle={styles.items}
			>
				{REVIEW_LINKS.map(({ icon, label, queueKey, to }) => (
					<SidebarItem
						key={to}
						aria-label={queues[queueKey].countLabel}
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
