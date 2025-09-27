import { motion } from 'framer-motion'
import { Check, Plus, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { TodoItem } from '~/components/TodoItem'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { useSectionedTodos } from '../api'

type SectionKey =
	| 'overdue'
	| 'today'
	| 'tomorrow'
	| 'nextSevenDays'
	| 'future'
	| 'unscheduled'

type FilterId = SectionKey

type FilterBadge = {
	id: FilterId
	label: string
	isActive: boolean
	onClick: () => void
}

const FILTER_ORDER: Array<FilterId> = [
	'overdue',
	'today',
	'tomorrow',
	'nextSevenDays',
	'future',
	'unscheduled'
]

export function TodosPage() {
	const [activeSections, setActiveSections] = useState<Array<SectionKey>>([])
	const { sections, addTodoToSection } = useSectionedTodos()

	const handleFilterClick = useCallback((filterId: FilterId) => {
		setActiveSections(prev => {
			const isActive = prev.includes(filterId)
			if (isActive) {
				return prev.filter(id => id !== filterId)
			}
			return [...prev, filterId]
		})
	}, [])

	const filters = useMemo(
		() =>
			FILTER_ORDER.map(filterId => {
				const section = sections.find(s => s.id === filterId)

				return {
					id: filterId,
					label: section?.label ?? filterId,
					isActive: activeSections.includes(filterId),
					onClick: () => handleFilterClick(filterId)
				}
			}).filter(filter => {
				// Hide overdue filter when overdue section has no entries
				if (filter.id === 'overdue') {
					const overdueSection = sections.find(s => s.id === 'overdue')
					return overdueSection && overdueSection.entries.length > 0
				}
				return true
			}),
		[activeSections, handleFilterClick, sections]
	)

	const activeFilters = filters.filter(filter => filter.isActive)
	const inactiveFilters = filters.filter(filter => !filter.isActive)
	const hasActiveFilters = activeFilters.length > 0

	type RenderedFilter =
		| { key: FilterId; type: 'filter'; filter: FilterBadge }
		| { key: 'clear'; type: 'clear' }

	const renderedFilters: Array<RenderedFilter> = hasActiveFilters
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
			}))

	const filteredSections = useMemo(() => {
		let sectionsToShow = sections

		if (activeSections.length === 0) {
			// Hide overdue section when it has no entries
			sectionsToShow = sections.filter(section => {
				if (section.id === 'overdue' && section.entries.length === 0) {
					return false
				}
				return true
			})
		} else {
			sectionsToShow = sections.filter(section =>
				activeSections.includes(section.id)
			)
		}

		return sectionsToShow
	}, [activeSections, sections])

	const handleClearFilters = useCallback(() => {
		setActiveSections([])
	}, [])

	return (
		<div className='container mx-auto'>
			<div className='sticky top-0 z-10 bg-background/95 p-6 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
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
										onClick={handleClearFilters}
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
									{item.filter.isActive && (
										<Check aria-hidden='true' className='h-4 w-4' />
									)}
									{item.filter.label}
								</Badge>
							</motion.div>
						)
					})}
				</motion.div>
			</div>
			<div className='px-6 pb-6'>
				{filteredSections.map(section => (
					<div className='mb-8' key={section.id}>
						<div className='mb-2 flex items-center justify-between'>
							<h2
								className={`font-bold text-3xl ${section.headingClassName ?? ''}`.trim()}
							>
								{section.label}
							</h2>
							{section.canAdd && (
								<Button
									className='mr-4'
									onClick={() => addTodoToSection(section.id)}
									size='sm'
									variant='ghost'
								>
									<Plus className='h-4 w-4' />
								</Button>
							)}
						</div>

						{section.entries.length > 0 ? (
							<div className='space-y-0.5'>
								{section.entries.map(entry => (
									<TodoItem
										entry={entry}
										isCompleted={entry.completed_at !== null}
										key={entry.id}
									/>
								))}
							</div>
						) : (
							<p className='text-muted-foreground text-sm italic'>
								{section.emptyMessage}
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
