import { use, useCallback } from 'react'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { TodoItem } from '~/features/todos/components/TodoItem'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { AddReviewButton } from './AddReviewButton'
import { LogNowButton } from './LogNowButton'
import { ReviewsDataProvider, useReviewsData } from './ReviewsDataContext'

function ReviewsSidebarContent() {
	const { scheduledTodos, unscheduledTodos } = useReviewsData()
	const { openTodoDialog } = useTodoTopicDialog()

	const handleTodoClick = useCallback(
		(todoId: number) => {
			openTodoDialog(todoId)
		},
		[openTodoDialog]
	)

	return (
		<Sidebar className='absolute border-l' side='right'>
			<SidebarHeader className='flex flex-row items-center justify-between pb-0'>
				<h1 className='font-semibold text-lg'>Reviews</h1>
				<div className='flex items-center gap-1'>
					<LogNowButton />
					<AddReviewButton />
				</div>
			</SidebarHeader>
			<SidebarContent className='scrollbar-track-transparent flex h-full flex-col gap-6 overflow-auto overscroll-contain px-2 pb-2'>
				{/* Scheduled Todos Section */}
				{scheduledTodos.length > 0 && (
					<div className='flex flex-col'>
						{scheduledTodos.map(entry => (
							<TodoItem
								entry={entry}
								key={entry.id}
								onTodoClick={handleTodoClick}
							/>
						))}
					</div>
				)}

				{/* Unscheduled Todos Section */}
				{unscheduledTodos.length > 0 && (
					<div className='flex flex-col'>
						<div className='flex flex-row items-center gap-2 pt-6'>
							<h2 className='font-semibold text-sm'>Unscheduled</h2>
						</div>
						<div className='flex flex-col'>
							{unscheduledTodos.map(entry => (
								<TodoItem
									entry={entry}
									key={entry.id}
									onTodoClick={handleTodoClick}
								/>
							))}
						</div>
					</div>
				)}
			</SidebarContent>
		</Sidebar>
	)
}

export function ReviewsSidebar() {
	const { topic: selectedTopic } = use(TopicContext)

	return (
		<ReviewsDataProvider selectedTopicId={selectedTopic?.id}>
			<ReviewsSidebarContent />
		</ReviewsDataProvider>
	)
}
