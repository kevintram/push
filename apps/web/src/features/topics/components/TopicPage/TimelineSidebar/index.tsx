import { use, useCallback } from 'react'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import { TodoItem } from '~/features/todos/components/TodoItem'
import { useTopicDialog } from '../../../hooks/useTopicDialog'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { AddTodoButton } from './AddTodoButton'
import { TimelineDataProvider, useTimelineData } from './TimelineDataContext'

function TimelineSidebarContent() {
	const { scheduledTodos, unscheduledTodos } = useTimelineData()
	const { openTopicDialog } = useTopicDialog()

	const handleTopicClick = useCallback(
		(topicId: number) => {
			openTopicDialog(topicId)
		},
		[openTopicDialog]
	)

	return (
		<Sidebar className='absolute border-l' side='right'>
			<SidebarHeader className='flex flex-row items-center justify-between'>
				<h1 className='font-semibold'>Timeline</h1>
				<AddTodoButton />
			</SidebarHeader>
			<SidebarContent className='scrollbar-track-transparent flex h-full flex-col gap-6 overflow-auto overscroll-contain px-2 pb-2'>
				{/* Scheduled Todos Section */}
				{scheduledTodos.length > 0 && (
					<div className='flex flex-col gap-2'>
						{scheduledTodos.map(entry => (
							<TodoItem
								entry={entry}
								key={entry.id}
								onTopicClick={handleTopicClick}
							/>
						))}
					</div>
				)}

				{/* Unscheduled Todos Section */}
				{unscheduledTodos.length > 0 && (
					<div className='flex flex-col gap-2'>
						<div className='flex flex-row items-center justify-between gap-2 border-b pb-1'>
							<h2 className='font-semibold text-sm'>Unscheduled</h2>
						</div>
						<div className='flex flex-col gap-1'>
							{unscheduledTodos.map(entry => (
								<TodoItem
									entry={entry}
									key={entry.id}
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

export function TimelineSidebar() {
	const { topic: selectedTopic } = use(TopicContext)

	return (
		<TimelineDataProvider selectedTopicId={selectedTopic?.id}>
			<TimelineSidebarContent />
		</TimelineDataProvider>
	)
}
