import type { EntityType } from '~/components/EntityCard'
import { Badge } from '~/components/ui/Badge'

export type EntityTypeFilterValue = 'all' | EntityType

const ENTITY_FILTER_BADGES: Record<EntityType, string> = {
	topic: 'Topics',
	source: 'Sources',
	practice: 'Practices'
}

export function EntityTypeFilter({
	activeFilter,
	onFilterChange,
	allowedTypes = ['topic', 'source', 'practice']
}: {
	activeFilter: EntityTypeFilterValue
	onFilterChange: (filter: EntityTypeFilterValue) => void
	allowedTypes?: Array<EntityType>
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
			{allowedTypes.map(type => {
				const isActive = activeFilter === type
				return (
					<Badge
						className='cursor-pointer'
						key={type}
						onClick={() => {
							if (!isActive) onFilterChange(type)
						}}
						onKeyDown={e => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								if (!isActive) onFilterChange(type)
							}
						}}
						tabIndex={0}
						variant={isActive ? 'default' : 'outline'}
					>
						{ENTITY_FILTER_BADGES[type]}
					</Badge>
				)
			})}
		</div>
	)
}
