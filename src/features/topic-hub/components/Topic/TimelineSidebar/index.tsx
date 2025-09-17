import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { use, useCallback } from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarSeparator } from '~/components/ui/Sidebar'
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
			.not('scheduled_at', 'is', null)
			.order('effective_date', { ascending: true })
	)

	const { data: unscheduledEntries } = useQuery<Array<Tables<'timeline_entries'>>>(
		supabase
			.from('timeline_entries')
			.select('*')
			.eq('topic_id', selectedTopic?.id ?? Number.NaN)
			.is('scheduled_at', null)
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
							<ScheduledEntry entry={entry} index={i} key={entry.id} nextDate={today} />
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
				<ScheduledEntry entry={entry} index={i} key={entry.id} nextDate={nextDate} />
			)
		})
	}, [timelineEntries])

	return (
		<Sidebar collapsible='none' side='right'>
			<SidebarHeader className='mb-2 flex flex-row items-center justify-between gap-2'>
				<h1 className='font-semibold'>Timeline</h1>
				<AddEntryButton />
			</SidebarHeader>
			<SidebarContent className='px-2'>{renderTimelineItems()}</SidebarContent>
			<SidebarSeparator className='mx-0' />
			<SidebarFooter className='flex min-h-[25%] flex-col gap-2'>
				<div className='flex flex-row items-center justify-between gap-2'>
					<h2 className='font-semibold text-sm'>Unscheduled</h2>
					<AddUnscheduledButton />
				</div>
				<div className='flex flex-col gap-1'>
					{unscheduledEntries?.map((entry) => (
						<UnscheduledEntry key={entry.id} entry={entry} />
					))}
				</div>
			</SidebarFooter>
		</Sidebar>
	)
}
