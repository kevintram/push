import { EntryItem } from '~/components/EntryItem'
import { useUpcomingEntries } from '../api'
import { EmptyState } from './EmptyState'

export function UpcomingSection() {
	const { data: upcomingEntries } = useUpcomingEntries()

	return (
		<div>
			<div className='mb-2'>
				<h2 className='font-bold text-3xl'>Scheduled</h2>
			</div>

			<div className='space-y-0.5'>
				{upcomingEntries?.map(entry => (
					<EntryItem entry={entry} isCompleted={false} key={entry.id} />
				))}
				{upcomingEntries?.length === 0 && <EmptyState message='Get gulping.' />}
			</div>
		</div>
	)
}
