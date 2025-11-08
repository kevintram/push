import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { useSectionedTodos } from '../api'
import { TodoItem } from './TodoItem'
import { TodosPageHeader } from './TodosPageHeader'

type SectionKey =
	| 'overdue'
	| 'today'
	| 'tomorrow'
	| 'nextSevenDays'
	| 'future'
	| 'unscheduled'
	| 'logbook'

type FilterId = SectionKey

type SectionState = {
	isActive: boolean
	isCollapsed: boolean
}

type SectionStates = Record<SectionKey, SectionState>

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
	const [sectionStates, setSectionStates] = useState<SectionStates>({
		overdue: { isActive: false, isCollapsed: false },
		today: { isActive: false, isCollapsed: false },
		tomorrow: { isActive: false, isCollapsed: false },
		nextSevenDays: { isActive: false, isCollapsed: false },
		future: { isActive: false, isCollapsed: false },
		unscheduled: { isActive: false, isCollapsed: false },
		logbook: { isActive: false, isCollapsed: false }
	})
	const { sections, addTodoToSection } = useSectionedTodos()
	const { openTodoDialog } = useTodoTopicDialog()
	const overdueSection = useMemo(
		() => sections.find(section => section.id === 'overdue'),
		[sections]
	)

	useEffect(() => {
		if (!overdueSection || overdueSection.entries.length > 0) {
			return
		}

		setSectionStates(prev => {
			if (!prev.overdue.isActive) {
				return prev
			}

			return {
				...prev,
				overdue: { ...prev.overdue, isActive: false }
			}
		})
	}, [overdueSection])

	const handleFilterClick = useCallback((filterId: FilterId) => {
		setSectionStates(prev => {
			const isActive = prev[filterId].isActive
			const isLogbookActive = prev.logbook.isActive

			// If clicking 'logbook', only show logbook
			if (filterId === 'logbook') {
				return Object.fromEntries(
					Object.entries(prev).map(([key, state]) => [
						key,
						{ ...state, isActive: key === 'logbook' ? !isActive : false }
					])
				) as SectionStates
			}

			// If logbook is currently active and clicking another filter, replace with that filter
			if (isLogbookActive) {
				return Object.fromEntries(
					Object.entries(prev).map(([key, state]) => [
						key,
						{ ...state, isActive: key === filterId }
					])
				) as SectionStates
			}

			// Toggle the clicked filter
			return {
				...prev,
				[filterId]: { ...prev[filterId], isActive: !isActive }
			}
		})
	}, [])

	const isLogbookActive = sectionStates.logbook.isActive

	const filters = useMemo(
		() =>
			FILTER_ORDER.map(filterId => {
				const section = sections.find(s => s.id === filterId)

				return {
					id: filterId,
					label: section?.label ?? filterId,
					isActive: sectionStates[filterId].isActive,
					onClick: () => handleFilterClick(filterId)
				}
			}).filter(filter => {
				// When logbook is active, hide all other filters
				if (isLogbookActive && filter.id !== 'logbook') {
					return false
				}
				// When any other filter is active, hide logbook
				const hasOtherActiveFilters = Object.entries(sectionStates).some(
					([id, state]) => id !== 'logbook' && state.isActive
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
		[sectionStates, handleFilterClick, sections, isLogbookActive]
	)


	const filteredSections = useMemo(() => {
		let sectionsToShow = sections

		const hasActiveFilters = Object.values(sectionStates).some(state => state.isActive)

		if (!hasActiveFilters) {
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
				sectionStates[section.id].isActive
			)
		}

		return sectionsToShow
	}, [sectionStates, sections])

	const handleClearFilters = useCallback(() => {
		setSectionStates(prev =>
			Object.fromEntries(
				Object.entries(prev).map(([key, state]) => [
					key,
					{ ...state, isActive: false }
				])
			) as SectionStates
		)
	}, [])

	const handleTodoClick = useCallback(
		(todoId: number) => {
			openTodoDialog(todoId)
		},
		[openTodoDialog]
	)

	const toggleSectionCollapse = useCallback((sectionId: SectionKey) => {
		setSectionStates(prev => ({
			...prev,
			[sectionId]: { ...prev[sectionId], isCollapsed: !prev[sectionId].isCollapsed }
		}))
	}, [])

	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				<TodosPageHeader filters={filters} onClearFilters={handleClearFilters} />
				<div className='px-6'>
					{filteredSections.map(section => {
						const isCollapsed = sectionStates[section.id].isCollapsed
						return (
							<div className='mb-2 mt-12' key={section.id}>
								<div className='flex items-center justify-between bg-primary-foreground'>
									<Button
										className='flex items-center gap-2 p-0 -translate-x-3'
										onClick={() => toggleSectionCollapse(section.id)}
										variant='ghost'
									>
										<h2
											className={`font-bold text-lg ${section.headingClassName ?? ''}`.trim()}
										>
											{section.label} <span className='text-muted-foreground'>({section.entries.length})</span>
										</h2>
										<ChevronDown className={`h-5 w-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
									</Button>
									{section.canAdd && (
										<Button
											className='mr-4'
											onClick={(e) => {
												e.stopPropagation()
												addTodoToSection(section.id)
											}}
											size='sm'
											variant='ghost'
										>
											<Plus className='h-4 w-4' />
										</Button>
									)}
								</div>

							{!isCollapsed && (
								section.entries.length > 0 ? (
									<div >
										{section.entries.map(entry => (
											<TodoItem
												entry={entry}
												key={entry.id}
												onTodoClick={handleTodoClick}
											/>
										))}
									</div>
								) : (
									<p className='text-muted-foreground text-sm italic'>
										{section.emptyMessage}
									</p>
								)
							)}
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
