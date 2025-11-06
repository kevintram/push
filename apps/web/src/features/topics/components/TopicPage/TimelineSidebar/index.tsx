import dayjs from 'dayjs'
import { use, useCallback } from 'react'
import {
	Panel,
	PanelGroup,
	ResizableHandle
} from '~/components/ui/ResizablePanel'
import { Sidebar, SidebarHeader } from '~/components/ui/Sidebar'
import { TodoItem } from '~/features/todos/components/TodoItem'
import { useTopicDialog } from '../../../hooks/useTopicDialog'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { AddScheduledTodoButton } from './AddScheduledTodoButton'
import { AddUnscheduledTodoButton } from './AddUnscheduledTodoButton'
import { TimelineDataProvider, useTimelineData } from './TimelineDataContext'
import { TodayMarker } from './TodayMarker'

function TimelineSidebarContent() {
	const { scheduledTodos, unscheduledTodos } = useTimelineData()
	const { openTopicDialog } = useTopicDialog()

	const handleTopicClick = useCallback(
		(topicId: number) => {
			openTopicDialog(topicId)
		},
		[openTopicDialog]
	)

	const renderTodos = useCallback(() => {
		// add today marker while rendering todos
		let todayInserted = false
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		return scheduledTodos.map((entry, i) => {
			const date: Date = dayjs(entry.effective_date).toDate()
			const nextEntry = scheduledTodos[i + 1]
			const nextDate: Date | undefined = nextEntry?.effective_date
				? dayjs(nextEntry.effective_date).toDate()
				: undefined

			if (!todayInserted) {
				if (today <= date) {
					todayInserted = true
					return (
						<>
							<TodayMarker key='today-marker' nextDate={date} today={today} />
							<TodoItem entry={entry} key={entry.id} onTopicClick={handleTopicClick} />
						</>
					)
				}

				if (i === scheduledTodos.length - 1 || today <= nextDate!) {
					todayInserted = true
					return (
						<>
							<TodoItem entry={entry} key={entry.id} onTopicClick={handleTopicClick} />
							<TodayMarker
								key='today-marker'
								nextDate={nextDate}
								today={today}
							/>
						</>
					)
				}
			}

			return <TodoItem entry={entry} key={entry.id} onTopicClick={handleTopicClick} />
		})
	}, [scheduledTodos, handleTopicClick])

	return (
		<Sidebar className='absolute border-l' side='right'>
			<SidebarHeader className='mb-2 flex flex-row items-center justify-between gap-2'>
				<h1 className='font-semibold'>Timeline</h1>
				<AddScheduledTodoButton />
			</SidebarHeader>
			<PanelGroup className='min-h-0 flex-1' direction='vertical'>
				<Panel
					className='min-h-0 overflow-hidden'
					defaultSize={70}
					minSize={20}
				>
					<div className='scrollbar-track-transparent flex h-full flex-col gap-2 overflow-auto overscroll-contain px-2 py-2'>
						{renderTodos()}
					</div>
				</Panel>
				<ResizableHandle />
				<Panel
					className='min-h-0 overflow-hidden'
					defaultSize={30}
					minSize={15}
				>
					<div className='scrollbar-track-transparent flex h-full flex-col gap-2 overflow-auto overscroll-contain p-2'>
						<div className='flex flex-shrink-0 flex-row items-center justify-between gap-2'>
							<h2 className='font-semibold text-sm'>Unscheduled</h2>
							<AddUnscheduledTodoButton />
						</div>
						<div className='flex min-h-0 flex-1 flex-col gap-1 overflow-auto'>
							{unscheduledTodos.map(entry => (
								<TodoItem entry={entry} key={entry.id} onTopicClick={handleTopicClick} />
							))}
						</div>
					</div>
				</Panel>
			</PanelGroup>
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
