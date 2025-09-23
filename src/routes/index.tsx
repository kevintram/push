import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { createFileRoute } from '@tanstack/react-router'
import { EntryItem } from '~/components/EntryItem'
import { supabase } from '~/utils/supabase'

export const Route = createFileRoute('/')({
	component: RouteComponent
})

function RouteComponent() {
	const today = new Date().toISOString().split('T')[0]

	const { data: todayEntries } = useQuery(
		supabase
			.from('timeline_entries_today')
			.select('*, topics(name)')
			.order('completed_at', { ascending: true, nullsFirst: true })
			.order('scheduled_at', { ascending: true })
	)

	const { data: upcomingEntries } = useQuery(
		supabase
			.from('timeline_entries')
			.select('*, topics(name)')
			.is('completed_at', null)
			.gt('scheduled_at', `${today}T23:59:59.999Z`)
			.order('scheduled_at', { ascending: true })
	)

	return (
		<div className='container mx-auto p-6'>
			{/* Today Section */}
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
						<div className='py-12 text-center'>
							<p className='text-muted-foreground'>
								No entries scheduled for today.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Upcoming Section */}
			<div>
				<div className='mb-2'>
					<h2 className='font-bold text-3xl'>Scheduled</h2>
				</div>

				<div className='space-y-0.5'>
					{upcomingEntries?.map(entry => (
						<EntryItem entry={entry} isCompleted={false} key={entry.id} />
					))}
					{upcomingEntries?.length === 0 && (
						<div className='py-12 text-center'>
							<p className='text-muted-foreground'>Get gulping.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
