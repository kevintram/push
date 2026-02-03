import type { EntityType } from '~/components/EntityCard'
import { Badge } from '~/components/ui/Badge'

export type EntityTypeFilterValue = 'all' | EntityType

const ENTITY_FILTER_BADGES: Array<{ id: EntityType; label: string }> = [
	{ id: 'topic', label: 'Topics' },
	{ id: 'source', label: 'Sources' },
	{ id: 'practice', label: 'Practices' }
]

export function EntityTypeFilter({
	activeFilter,
	onFilterChange
}: {
	activeFilter: EntityTypeFilterValue
	onFilterChange: (filter: EntityTypeFilterValue) => void
}) {
	const isAllActive = activeFilter === 'all'
	return (
		<div className='flex items-center gap-2'>
			<Badge
				className='cursor-pointer'
				onClick={() => {
					if (!isAllActive) onFilterChange('all')
				}}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						if (!isAllActive) onFilterChange('all')
					}
				}}
				tabIndex={0}
				variant={isAllActive ? 'default' : 'outline'}
			>
				All
			</Badge>
			{ENTITY_FILTER_BADGES.map(badge => {
				const isActive = activeFilter === badge.id
				return (
					<Badge
						className='cursor-pointer'
						key={badge.id}
						onClick={() => {
							if (!isActive) onFilterChange(badge.id)
						}}
						onKeyDown={e => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								if (!isActive) onFilterChange(badge.id)
							}
						}}
						tabIndex={0}
						variant={isActive ? 'default' : 'outline'}
					>
						{badge.label}
					</Badge>
				)
			})}
		</div>
	)
}
