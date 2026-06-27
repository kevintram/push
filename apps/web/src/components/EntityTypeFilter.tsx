import { Badge } from '~/components/ui/badge'

export type EntityType = 'topic' | 'practice' | 'flashcard'
export type EntityTypeFilterValue = 'all' | EntityType

const ENTITY_FILTER_BADGES: Record<EntityType, string> = {
	topic: 'Topics',
	practice: 'Practices',
	flashcard: 'Flashcards',
}

export function EntityTypeFilter({
	activeFilter,
	onFilterChange,
	allowedTypes = ['topic', 'practice', 'flashcard'],
	showAllOption = true,
	showNoTagOption = false,
}: {
	activeFilter: EntityTypeFilterValue
	onFilterChange: (filter: EntityTypeFilterValue) => void
	allowedTypes?: Array<EntityType>
	showAllOption?: boolean
	showNoTagOption?: boolean
}) {
	const isAllActive = activeFilter === 'all'
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
		</div>
	)
}
