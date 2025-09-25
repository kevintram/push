import { motion } from 'framer-motion'
import { Archive, Check, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { EntryItem } from '~/components/EntryItem'
import { Badge } from '~/components/ui/Badge'
import { useTodoEntries } from '../api'
import { EmptyState } from './EmptyState'

type SectionKey =
	| 'overdue'
	| 'today'
	| 'tomorrow'
	| 'nextSevenDays'
	| 'future'
	| 'unscheduled'

type SectionDefinition = {
	id: SectionKey
	label: string
	headingClassName?: string
}

type FilterId = SectionKey | 'archive'

type FilterBadge = {
	id: FilterId
	label: string
	isActive: boolean
	onClick: () => void
}

const SECTION_DEFINITIONS: Array<SectionDefinition> = [
	{
		id: 'overdue',
		label: 'Overdue',
		headingClassName: 'text-red-600'
	},
	{ id: 'today', label: 'Today' },
	{ id: 'tomorrow', label: 'Tomorrow' },
	{ id: 'nextSevenDays', label: 'Next 7 Days' },
	{ id: 'future', label: 'In the Future' },
	{ id: 'unscheduled', label: 'Unscheduled', headingClassName: 'text-gray-600' }
]

const FILTERS: Array<FilterId> = [
	'today',
	'tomorrow',
	'nextSevenDays',
	'future',
	'overdue',
	'unscheduled',
	'archive'
]

export function TodosPage() {
	const [showArchived, setShowArchived] = useState(false)
	const [activeSections, setActiveSections] = useState<Array<SectionKey>>([])
	const { overdue, today, tomorrow, nextSevenDays, future, unscheduled } =
		useTodoEntries(showArchived)

	const sectionEntries = useMemo(
		() => ({
			overdue: overdue ?? [],
			today: today ?? [],
			tomorrow: tomorrow ?? [],
			nextSevenDays: nextSevenDays ?? [],
			future: future ?? [],
			unscheduled: unscheduled ?? []
		}),
		[overdue, today, tomorrow, nextSevenDays, future, unscheduled]
	)

	const sections = useMemo(
		() =>
			SECTION_DEFINITIONS.map(definition => ({
				...definition,
				entries: sectionEntries[definition.id]
			})),
		[sectionEntries]
	)

	const handleFilterClick = useCallback((filterId: FilterId) => {
		if (filterId === 'archive') {
			setShowArchived(prev => !prev)
			return
		}

		setActiveSections(prev => {
			const isActive = prev.includes(filterId)
			if (isActive) {
				return prev.filter(id => id !== filterId)
			}
			return [...prev, filterId]
		})
	}, [])

	const filters = FILTERS.map(filterId => {
		const sectionDefinition = SECTION_DEFINITIONS.find(
			definition => definition.id === filterId
		)

		return {
			id: filterId,
			label:
				filterId === 'archive'
					? 'Archived'
					: (sectionDefinition?.label ?? filterId),
			isActive:
				filterId === 'archive'
					? showArchived
					: activeSections.includes(filterId),
			onClick: () => handleFilterClick(filterId)
		}
	})

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
		if (activeSections.length === 0) {
			return sections
		}

		return sections.filter(section => activeSections.includes(section.id))
	}, [activeSections, sections])

	const visibleSections = filteredSections.filter(
		section => section.entries.length > 0
	)

	const hasAnyEntries = visibleSections.length > 0

	const handleClearFilters = useCallback(() => {
		setActiveSections([])
		setShowArchived(false)
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
									{item.filter.id === 'archive' && (
										<Archive className='h-4 w-4' />
									)}
									{item.filter.label}
								</Badge>
							</motion.div>
						)
					})}
				</motion.div>
			</div>
			<div className='px-6 pb-6'>
				{visibleSections.map(section => (
					<div className='mb-8' key={section.id}>
						<div className='mb-2'>
							<h2
								className={`font-bold text-3xl ${section.headingClassName ?? ''}`.trim()}
							>
								{section.label}
							</h2>
						</div>

						<div className='space-y-0.5'>
							{section.entries.map(entry => (
								<EntryItem
									entry={entry}
									isCompleted={entry.completed_at !== null}
									key={entry.id}
								/>
							))}
						</div>
					</div>
				))}

				{!hasAnyEntries && (
					<EmptyState
						message={
							showArchived
								? 'No archived entries found.'
								: 'No entries found. Get gulping!'
						}
					/>
				)}
			</div>
		</div>
	)
}
