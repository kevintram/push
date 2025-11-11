import { ChevronDown, Plus } from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { SidebarHolder, SidebarProvider } from '~/components/ui/Sidebar'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { useSectionedTodos } from '../api'
import { TodoItem } from './TodoItem'
import { TodosPageHeader } from './TodosPageHeader'
import { TodosPageSkeleton } from './TodosPageSkeleton'
import { TopicsSidebar } from './TopicsSidebar'

export function TodosPage() {
	const {
		filteredSections,
		filters,
		addTodoToSection,
		toggleSectionCollapse,
		handleClearFilters,
		isLoading
	} = useSectionedTodos()
	const { openTodoDialog } = useTodoTopicDialog()

	const handleTodoClick = useCallback(
		(todoId: number) => {
			openTodoDialog(todoId)
		},
		[openTodoDialog]
	)

	const handleAddTodo = useCallback(
		async (sectionId: string) => {
			const newTodoId = await addTodoToSection(
				sectionId as Parameters<typeof addTodoToSection>[0]
			)
			openTodoDialog(newTodoId)
		},
		[addTodoToSection, openTodoDialog]
	)

	if (isLoading) {
		return <TodosPageSkeleton />
	}

	return (
		<SidebarProvider defaultOpen={true}>
			<SidebarHolder className='scrollbar-track-transparent relative h-full w-full'>
				<div className='flex h-full flex-col overflow-auto'>
					<TodosPageHeader
						filters={filters}
						onClearFilters={handleClearFilters}
					/>
					<div className='px-6'>
						{filteredSections.map((section, index) => {
							const prev = index > 0 ? filteredSections[index - 1] : undefined
							return (
								<div
									className={`mb-2 ${prev?.isCollapsed ? '' : 'mt-12'}`}
									key={section.id}
								>
									<div className='flex items-center justify-between bg-primary-foreground'>
										<Button
											className='-translate-x-3 flex items-center gap-2 p-0'
											onClick={() => toggleSectionCollapse(section.id)}
											variant='ghost'
										>
											<h2
												className={`font-bold text-lg ${section.headingClassName ?? ''}`.trim()}
											>
												{section.label}{' '}
												<span className='text-muted-foreground'>
													({section.entries.length})
												</span>
											</h2>
											<ChevronDown
												className={`h-5 w-5 transition-transform ${section.isCollapsed ? '-rotate-90' : ''}`}
											/>
										</Button>
										{section.canAdd && (
											<Button
												className='mr-4'
												onClick={e => {
													e.stopPropagation()
													handleAddTodo(section.id)
												}}
												size='sm'
												variant='ghost'
											>
												<Plus className='h-4 w-4' />
											</Button>
										)}
									</div>

									{!section.isCollapsed &&
										(section.entries.length > 0 ? (
											<div>
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
										))}
								</div>
							)
						})}
					</div>
				</div>
				<TopicsSidebar />
			</SidebarHolder>
		</SidebarProvider>
	)
}
