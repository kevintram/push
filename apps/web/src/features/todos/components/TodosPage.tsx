import { Plus } from 'lucide-react'
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
	const { openTodoDialog } = useTodoTopicDialog()
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

	const handleTodoClick = useCallback(
		(todoId: number) => {
			openTodoDialog(todoId)
		},
		[openTodoDialog]
	)

	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				<TodosPageHeader filters={filters} onClearFilters={handleClearFilters} />
				<div className='px-6'>
					{filteredSections.map(section => (
						<div className='mb-2 mt-12' key={section.id}>
							<div className='flex items-center justify-between bg-primary-foreground'>
								<h2
									className={`font-bold text-l ${section.headingClassName ?? ''}`.trim()}
								>
									{section.label} <span className='text-muted-foreground'>({section.entries.length})</span>
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
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
