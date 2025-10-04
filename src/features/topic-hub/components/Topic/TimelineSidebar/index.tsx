import { use, useCallback } from 'react'
import {
	Panel,
	PanelGroup,
	ResizableHandle
} from '~/components/ui/ResizablePanel'
import { Sidebar, SidebarHeader } from '~/components/ui/Sidebar'
import { dateOf } from '../../../../../utils/dateOf'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { AddScheduledTodoButton } from './AddScheduledTodoButton'
import { AddUnscheduledTodoButton } from './AddUnscheduledTodoButton'
import { ScheduledTodo } from './ScheduledTodo'
import { TimelineDataProvider, useTimelineData } from './TimelineDataContext'
import { TodayMarker } from './TodayMarker'
import { UnscheduledTodo } from './UnscheduledTodo'

function TimelineSidebarContent() {
	const { scheduledTodos, unscheduledTodos } = useTimelineData()

	const renderTodos = useCallback(() => {
		// add today marker while rendering todos
		let todayInserted = false
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		return scheduledTodos.map((entry, i) => {
			const date: Date = dateOf(entry.effective_date)!
			const nextDate: Date | undefined = dateOf(
				scheduledTodos[i + 1]?.effective_date
			)

			if (!todayInserted) {
				if (today <= date) {
					todayInserted = true
					return (
						<>
							<TodayMarker key='today-marker' nextDate={date} today={today} />
							<ScheduledTodo
								entry={entry}
								index={i}
								key={entry.id}
								nextDate={nextDate}
							/>
						</>
					)
				}

				if (i === scheduledTodos.length - 1 || today <= nextDate!) {
					todayInserted = true
					return (
						<>
							<ScheduledTodo
								entry={entry}
								index={i}
								key={entry.id}
								nextDate={today}
							/>
							<TodayMarker
								key='today-marker'
								nextDate={nextDate}
								today={today}
							/>
						</>
					)
				}
			}

			return (
				<ScheduledTodo
					entry={entry}
					index={i}
					key={entry.id}
					nextDate={nextDate}
				/>
			)
		})
	}, [scheduledTodos])

	return (
		<Sidebar
			collapsible='none'
			side='right'
			style={
				{
					'--sidebar-width': '20rem'
				} as React.CSSProperties
			}
		>
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
					<div className='flex h-full flex-col gap-2 overflow-auto px-2 py-2'>
						{renderTodos()}
					</div>
				</Panel>
				<ResizableHandle />
				<Panel
					className='min-h-0 overflow-hidden'
					defaultSize={30}
					minSize={15}
				>
					<div className='flex h-full flex-col gap-2 overflow-auto p-2'>
						<div className='flex flex-shrink-0 flex-row items-center justify-between gap-2'>
							<h2 className='font-semibold text-sm'>Unscheduled</h2>
							<AddUnscheduledTodoButton />
						</div>
						<div className='flex min-h-0 flex-1 flex-col gap-1 overflow-auto'>
							{unscheduledTodos.map(entry => (
								<UnscheduledTodo entry={entry} key={entry.id} />
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
