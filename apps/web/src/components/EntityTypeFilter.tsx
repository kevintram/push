import type { EntityType } from '~/components/EntityCard'
import { Badge } from '~/components/ui/Badge'

const ENTITY_FILTER_BADGES: Array<{ id: EntityType; label: string }> = [
	{ id: 'topic', label: 'Topics' },
	{ id: 'source', label: 'Sources' },
	{ id: 'practice', label: 'Practices' }
]

export function EntityTypeFilter({
	activeFilters,
	onAllClick,
	onToggle
}: {
	activeFilters: Array<EntityType>
	onAllClick: () => void
	onToggle: (filter: EntityType) => void
}) {
	return (
		<div className='flex items-center gap-2'>
			<Badge
				className='cursor-pointer'
				onClick={onAllClick}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						onAllClick()
					}
				}}
				tabIndex={0}
				variant={activeFilters.length === 0 ? 'default' : 'outline'}
			>
				All
			</Badge>
			{ENTITY_FILTER_BADGES.map(badge => {
				const isActive = activeFilters.includes(badge.id)
				return (
					<Badge
						className='cursor-pointer'
						key={badge.id}
						onClick={() => onToggle(badge.id)}
						onKeyDown={e => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								onToggle(badge.id)
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
