import { EntryItem } from '~/components/EntryItem'
import { useTodayEntries } from '../api'
import { EmptyState } from './EmptyState'

export function TodaySection() {
	const { data: todayEntries } = useTodayEntries()

	return (
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
	)
}
