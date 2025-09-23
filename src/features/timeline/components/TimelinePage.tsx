import { EntryItem } from '~/components/EntryItem'
import { useTimelineEntries } from '../api'
import { EmptyState } from './EmptyState'

export function TimelinePage() {
	const { overdueEntries, todayEntries, upcomingEntries } = useTimelineEntries()

	return (
		<div className='container mx-auto p-6'>
			{overdueEntries && overdueEntries.length > 0 && (
				<div className='mb-8'>
					<div className='mb-2'>
						<h1 className='font-bold text-3xl text-red-600'>Overdue</h1>
					</div>

					<div className='space-y-0.5'>
						{overdueEntries.map(entry => (
							<EntryItem
								entry={entry}
								isCompleted={entry.completed_at !== null}
								key={entry.id}
							/>
						))}
					</div>
				</div>
			)}

			<div className='mb-8'>
				<div className='mb-2'>
					<h1 className='font-bold text-3xl'>Today</h1>
				</div>

				<div className='space-y-0.5'>
					{todayEntries?.map(entry => (
						<EntryItem
							entry={entry}
							isCompleted={entry.completed_at !== null}
							key={entry.id}
						/>
					))}
					{todayEntries?.length === 0 && (
						<EmptyState message='No entries scheduled for today.' />
					)}
				</div>
			</div>

			<div>
				<div className='mb-2'>
					<h2 className='font-bold text-3xl'>Scheduled</h2>
				</div>

				<div className='space-y-0.5'>
					{upcomingEntries?.map(entry => (
						<EntryItem entry={entry} isCompleted={false} key={entry.id} />
					))}
					{upcomingEntries?.length === 0 && (
						<EmptyState message='Get gulping.' />
					)}
				</div>
			</div>
		</div>
	)
}
