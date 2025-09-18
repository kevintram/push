import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { use, useCallback } from 'react'
import {
	Panel,
	PanelGroup,
	ResizableHandle
} from '~/components/ui/ResizablePanel'
import { Sidebar, SidebarHeader } from '~/components/ui/Sidebar'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { dateOf } from '../../../../../utils/dateOf'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'
import { AddEntryButton } from './AddScheduledEntryButton'
import { AddUnscheduledButton } from './AddUnscheduledEntryButton'
import { ScheduledEntry } from './ScheduledEntry'
import { TodayMarker } from './TodayMarker'
import { UnscheduledEntry } from './UnscheduledEntry'

type TimelineEntry = Tables<'timeline_entries_with_effective_date'>

export function TimelineSidebar() {
	const { selectedTopic } = use(TopicHubContext)

	const { data: timelineEntries } = useQuery<Array<TimelineEntry>>(
		supabase
			.from('timeline_entries_with_effective_date')
			.select('*')
			.eq('topic_id', selectedTopic?.id ?? Number.NaN)
			.not('effective_date', 'is', null)
			.order('effective_date', { ascending: true })
	)

	const { data: unscheduledEntries } = useQuery<
		Array<Tables<'timeline_entries'>>
	>(
		supabase
			.from('timeline_entries')
			.select('*')
			.eq('topic_id', selectedTopic?.id ?? Number.NaN)
			.is('scheduled_at', null)
			.is('completed_at', null)
			.order('inserted_at', { ascending: false })
	)

	const renderTimelineItems = useCallback(() => {
		// add today marker while rendering timeline items
		let todayInserted = false
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		return timelineEntries?.map((entry, i) => {
			const date: Date = dateOf(entry.effective_date)!
			const nextDate: Date | undefined = dateOf(
				timelineEntries[i + 1]?.effective_date
			)

			if (!todayInserted) {
				if (today <= date) {
					todayInserted = true
					return (
						<>
							<TodayMarker key='today-marker' nextDate={date} today={today} />
							<ScheduledEntry
								entry={entry}
								index={i}
								key={entry.id}
								nextDate={nextDate}
							/>
						</>
					)
				}

				if (i === timelineEntries.length - 1 || today <= nextDate!) {
					todayInserted = true
					return (
						<>
							<ScheduledEntry
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
				<ScheduledEntry
					entry={entry}
					index={i}
					key={entry.id}
					nextDate={nextDate}
				/>
			)
		})
	}, [timelineEntries])

	return (
		<Sidebar collapsible='none' side='right'>
			<SidebarHeader className='mb-2 flex flex-row items-center justify-between gap-2'>
				<h1 className='font-semibold'>Timeline</h1>
				<AddEntryButton />
			</SidebarHeader>
			<PanelGroup className='min-h-0 flex-1' direction='vertical'>
				<Panel
					className='min-h-0 overflow-hidden'
					defaultSize={70}
					minSize={20}
				>
					<div className='flex h-full flex-col gap-2 overflow-auto px-2 py-2'>
						{renderTimelineItems()}
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
							<AddUnscheduledButton />
						</div>
						<div className='flex min-h-0 flex-1 flex-col gap-1 overflow-auto'>
							{unscheduledEntries?.map(entry => (
								<UnscheduledEntry entry={entry} key={entry.id} />
							))}
						</div>
					</div>
				</Panel>
			</PanelGroup>
		</Sidebar>
	)
}
