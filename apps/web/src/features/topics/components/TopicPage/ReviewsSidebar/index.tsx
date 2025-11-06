import { use, useCallback } from 'react'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import { useTodoDialog } from '~/features/todos'
import { TodoItem } from '~/features/todos/components/TodoItem'
import { useTopicDialog } from '../../../hooks/useTopicDialog'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { AddReviewButton } from './AddReviewButton'
import { ReviewsDataProvider, useReviewsData } from './ReviewsDataContext'

function ReviewsSidebarContent() {
	const { scheduledTodos, unscheduledTodos } = useReviewsData()
	const { openTopicDialog } = useTopicDialog()
	const { openTodoDialog } = useTodoDialog()

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
		<Sidebar className='absolute border-l' side='right'>
			<SidebarHeader className='flex flex-row items-center justify-between'>
				<h1 className='font-semibold text-lg'>Reviews</h1>
				<AddReviewButton />
			</SidebarHeader>
			<SidebarContent className='scrollbar-track-transparent flex h-full flex-col gap-6 overflow-auto overscroll-contain px-2 pb-2'>
				{/* Scheduled Todos Section */}
				{scheduledTodos.length > 0 && (
					<div className='flex flex-col gap-2'>
						{scheduledTodos.map(entry => (
							<TodoItem
								entry={entry}
								key={entry.id}
								onTodoClick={handleTodoClick}
								onTopicClick={handleTopicClick}
							/>
						))}
					</div>
				)}

				{/* Unscheduled Todos Section */}
				{unscheduledTodos.length > 0 && (
					<div className='flex flex-col gap-2'>
						<div className='flex flex-row items-center justify-between gap-2 border-b pt-6 pb-1'>
							<h2 className='font-semibold text-sm'>Unscheduled</h2>
						</div>
						<div className='flex flex-col gap-1'>
							{unscheduledTodos.map(entry => (
								<TodoItem
									entry={entry}
									key={entry.id}
									onTodoClick={handleTodoClick}
									onTopicClick={handleTopicClick}
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
