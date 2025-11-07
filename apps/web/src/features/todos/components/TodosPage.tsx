import { motion } from 'framer-motion'
import { Check, Logs, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { useSectionedTodos } from '../api'
import { TodoItem } from './TodoItem'

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

const FILTER_ORDER: Array<FilterId> = [
	'overdue',
	'today',
	'tomorrow',
	'nextSevenDays',
	'future',
	'unscheduled',
	'logbook'
]

export function TodosPage() {
	const [activeSections, setActiveSections] = useState<Array<SectionKey>>([])
	const { sections, addTodoToSection } = useSectionedTodos()
	const { openTopicDialog, openTodoDialog } = useTodoTopicDialog()
	const overdueSection = useMemo(
		() => sections.find(section => section.id === 'overdue'),
		[sections]
	)

	useEffect(() => {
		if (!overdueSection || overdueSection.entries.length > 0) {
			return
		}

		setActiveSections(prev => {
			if (!prev.includes('overdue')) {
				return prev
			}

			return prev.filter(sectionId => sectionId !== 'overdue')
		})
	}, [overdueSection])

	const handleFilterClick = useCallback((filterId: FilterId) => {
		setActiveSections(prev => {
			const isActive = prev.includes(filterId)
			if (isActive) {
				return prev.filter(id => id !== filterId)
			}
			// If clicking 'logbook', only show logbook
			if (filterId === 'logbook') {
				return ['logbook']
			}
			// If logbook is currently active and clicking another filter, replace with that filter
			if (prev.includes('logbook')) {
				return [filterId]
			}
			return [...prev, filterId]
		})
	}, [])

	const isLogbookActive = activeSections.includes('logbook')

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
				// When logbook is active, hide all other filters
				if (isLogbookActive && filter.id !== 'logbook') {
					return false
				}
				// When any other filter is active, hide logbook
				const hasOtherActiveFilters = activeSections.some(
					id => id !== 'logbook'
				)
				if (hasOtherActiveFilters && filter.id === 'logbook') {
					return false
				}
				// Hide overdue filter when overdue section has no entries
				if (filter.id === 'overdue') {
					const overdueSection = sections.find(s => s.id === 'overdue')
					return overdueSection && overdueSection.entries.length > 0
				}
				return true
			}),
		[activeSections, handleFilterClick, sections, isLogbookActive]
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
			// Hide overdue and logbook sections when they have no entries
			sectionsToShow = sections.filter(section => {
				if (section.id === 'overdue' && section.entries.length === 0) {
					return false
				}
				if (section.id === 'logbook' && section.entries.length === 0) {
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

	const handleTopicClick = useCallback(
		(topicId: number) => {
			openTopicDialog(topicId)
		},
		[openTopicDialog]
	)

	const handleTodoClick = useCallback(
		(todoId: number) => {
			openTodoDialog(todoId)
		},
		[openTodoDialog]
	)

	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-4 pt-4 pb-0'>
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
				<div className='px-6'>
					{filteredSections.map(section => (
						<div className='mb-4' key={section.id}>
							<div className='sticky top-[82px] z-[5] flex items-center justify-between bg-primary-foreground py-2'>
								<h2
									className={`font-bold text-l ${section.headingClassName ?? ''}`.trim()}
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
								<div className='space-y-4'>
									{section.entries.map(entry => (
										<TodoItem
											entry={entry}
											key={entry.id}
											onTodoClick={handleTodoClick}
											onTopicClick={handleTopicClick}
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
		</div>
	)
}
