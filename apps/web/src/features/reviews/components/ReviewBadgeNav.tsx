import { useNavigate } from '@tanstack/react-router'
import { Badge } from '~/components/ui/Badge'

export type BadgeType = 'soon' | 'future' | 'unscheduled' | 'logbook'

type BadgeConfig = {
	id: BadgeType
	label: string
	path: string
}

const BADGES: Array<BadgeConfig> = [
	{
		id: 'soon',
		label: 'Soon',
		path: '/reviews/soon'
	},
	{
		id: 'future',
		label: 'Future',
		path: '/reviews/future'
	},
	{
		id: 'unscheduled',
		label: 'Unscheduled',
		path: '/reviews/unscheduled'
	},
	{
		id: 'logbook',
		label: 'Logbook',
		path: '/reviews/logbook'
	}
]

type ReviewBadgeNavProps = {
	activeBadge: BadgeType
}

export function ReviewBadgeNav({ activeBadge }: ReviewBadgeNavProps) {
	const navigate = useNavigate()

	return (
		<nav className='flex gap-2'>
			{BADGES.map(badge => {
				const isActive = badge.id === activeBadge
				return (
					<Badge
						className='cursor-pointer'
						key={badge.id}
						onClick={() => navigate({ to: badge.path })}
						onKeyDown={e => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								navigate({ to: badge.path })
							}
						}}
						variant={isActive ? 'default' : 'outline'}
					>
						{badge.label}
					</Badge>
				)
			})}
		</nav>
	)
}
