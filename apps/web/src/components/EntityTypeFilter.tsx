import { Badge } from '~/components/ui/badge'

export type EntityType = 'topic' | 'source' | 'practice'
export type EntityTypeFilterValue = 'all' | 'none' | EntityType

const ENTITY_FILTER_BADGES: Record<EntityType, string> = {
	topic: 'Topics',
	source: 'Sources',
	practice: 'Practices'
}

export function EntityTypeFilter({
	activeFilter,
	onFilterChange,
	allowedTypes = ['topic', 'source', 'practice'],
	showAllOption = true,
	showNoTagOption = true
}: {
	activeFilter: EntityTypeFilterValue
	onFilterChange: (filter: EntityTypeFilterValue) => void
	allowedTypes?: Array<EntityType>
	showAllOption?: boolean
	showNoTagOption?: boolean
}) {
	const isAllActive = activeFilter === 'all'
	const isNoneActive = activeFilter === 'none'
	const shouldHideFilter =
		!(showAllOption || showNoTagOption) && allowedTypes.length <= 1

	if (shouldHideFilter) {
		return null
	}

	return (
		<div className='flex items-center gap-2'>
			{showAllOption ? (
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
			) : null}
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
			{showNoTagOption ? (
				<Badge
					className='cursor-pointer'
					onClick={() => {
						if (!isNoneActive) onFilterChange('none')
					}}
					onKeyDown={e => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							if (!isNoneActive) onFilterChange('none')
						}
					}}
					tabIndex={0}
					variant={isNoneActive ? 'default' : 'outline'}
				>
					No tags
				</Badge>
			) : null}
		</div>
	)
}
