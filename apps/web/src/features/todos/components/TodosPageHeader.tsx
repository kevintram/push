import { motion } from 'framer-motion'
import { Check, Logs, X } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '~/components/ui/Badge'

type SectionKey =
	| 'overdue'
	| 'today'
	| 'tomorrow'
	| 'nextSevenDays'
	| 'future'
	| 'unscheduled'
	| 'logbook'

type FilterId = SectionKey

type FilterBadge = {
	id: FilterId
	label: string
	isActive: boolean
	onClick: () => void
}

type TodosPageHeaderProps = {
	filters: Array<FilterBadge>
	onClearFilters: () => void
}

export function TodosPageHeader({
	filters,
	onClearFilters
}: TodosPageHeaderProps) {
	const activeFilters = filters.filter(filter => filter.isActive)
	const inactiveFilters = filters.filter(filter => !filter.isActive)
	const hasActiveFilters = activeFilters.length > 0

	type RenderedFilter =
		| { key: FilterId; type: 'filter'; filter: FilterBadge }
		| { key: 'clear'; type: 'clear' }

	const renderedFilters: Array<RenderedFilter> = useMemo(
		() =>
			hasActiveFilters
				? [
						...activeFilters.map(filter => ({
							key: filter.id,
							type: 'filter' as const,
							filter
						})),
						{ key: 'clear', type: 'clear' as const },
						...inactiveFilters.map(filter => ({
							key: filter.id,
							type: 'filter' as const,
							filter
						}))
					]
				: filters.map(filter => ({
						key: filter.id,
						type: 'filter' as const,
						filter
					})),
		[hasActiveFilters, activeFilters, inactiveFilters, filters]
	)

	return (
		<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-1 backdrop-blur-sm'>
			<div className='flex items-center justify-between'>
				<h1 className='font-bold text-xl'>Todos</h1>
			</div>
			<div className='top-0 z-10 pt-2 pb-1'>
				<motion.div
					className='flex flex-wrap items-center gap-2'
					layout={true}
					transition={{ duration: 0.2, ease: 'easeInOut' }}
				>
					{renderedFilters.map(item => {
						if (item.type === 'clear') {
							return (
								<motion.div
									key='clear'
									layout={true}
									transition={{ duration: 0.2, ease: 'easeInOut' }}
								>
									<Badge
										aria-label='Clear filters'
										className='flex cursor-pointer items-center gap-1'
										onClick={onClearFilters}
										variant='secondary'
									>
										<X className='h-4 w-4' />
									</Badge>
								</motion.div>
							)
						}

						return (
							<motion.div
								key={item.key}
								layout={true}
								transition={{ duration: 0.2, ease: 'easeInOut' }}
							>
								<Badge
									className='flex cursor-pointer items-center gap-1'
									onClick={item.filter.onClick}
									variant={item.filter.isActive ? 'default' : 'outline'}
								>
									{item.filter.id === 'logbook' ? (
										<Logs aria-hidden='true' className='h-4 w-4' />
									) : (
										item.filter.isActive && (
											<Check aria-hidden='true' className='h-4 w-4' />
										)
									)}
									{item.filter.label}
								</Badge>
							</motion.div>
						)
					})}
				</motion.div>
			</div>
		</div>
	)
}
