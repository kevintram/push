import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { createFileRoute } from '@tanstack/react-router'
import { EntryItem } from '~/components/EntryItem'
import { supabase } from '~/utils/supabase'

export const Route = createFileRoute('/upcoming')({
	component: RouteComponent
})

function RouteComponent() {
	const today = new Date().toISOString().split('T')[0]

	const { data: timelineEntries } = useQuery(
		supabase
			.from('timeline_entries')
			.select('*, topics(name)')
			.is('completed_at', null)
			.gt('scheduled_at', `${today}T23:59:59.999Z`)
			.order('scheduled_at', { ascending: true })
	)

	return (
		<div className='container mx-auto p-6'>
			<div className='mb-2'>
				<h1 className='font-bold text-3xl'>Scheduled</h1>
			</div>

			<div className='space-y-0.5'>
				{timelineEntries?.map(entry => (
					<EntryItem entry={entry} isCompleted={false} key={entry.id} />
				))}
				{timelineEntries?.length === 0 && (
					<div className='py-12 text-center'>
						<p className='text-muted-foreground'>Get gulping.</p>
					</div>
				)}
			</div>
		</div>
	)
}
