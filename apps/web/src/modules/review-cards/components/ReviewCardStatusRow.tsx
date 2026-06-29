import {
	type StatusBadgeItem,
	StatusBadgeList,
} from '~/components/ui/status-badge'

export function ReviewCardStatusRow({
	badges,
}: {
	badges: Array<StatusBadgeItem>
}) {
	if (badges.length === 0) return null

	return (
		<StatusBadgeList
			badgeClassName='pointer-events-auto'
			badges={badges}
			className='pointer-events-none absolute top-[0.5px] right-3 z-5 max-w-[calc(100%-1.5rem)] -translate-y-1/2 justify-end'
		/>
	)
}
