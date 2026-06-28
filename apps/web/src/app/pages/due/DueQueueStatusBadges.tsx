import {
	type StatusBadgeItem,
	StatusBadgeList,
} from '~/components/ui/status-badge'

type DueQueueStatusBadgesProps = {
	dueTodayCount: number
	newCount: number
	overdueCount: number
}

function buildDueQueueStatusBadges({
	dueTodayCount,
	newCount,
	overdueCount,
}: DueQueueStatusBadgesProps): Array<StatusBadgeItem> {
	const badges: Array<StatusBadgeItem> = []

	if (overdueCount > 0) {
		badges.push({
			label: `${overdueCount} Overdue`,
			tone: 'danger',
		})
	}

	if (dueTodayCount > 0) {
		badges.push({
			label: `${dueTodayCount} Due`,
			tone: 'info',
		})
	}

	if (newCount > 0) {
		badges.push({
			label: `${newCount} New`,
			tone: 'neutral',
		})
	}

	return badges
}

export function DueQueueStatusBadges(props: DueQueueStatusBadgesProps) {
	return (
		<StatusBadgeList
			badges={buildDueQueueStatusBadges(props)}
			className='shrink-0'
		/>
	)
}
