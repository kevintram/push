import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { createFileRoute } from '@tanstack/react-router'
import { EntryItem } from '~/components/EntryItem'
import { supabase } from '~/utils/supabase'

export const Route = createFileRoute('/logbook')({
	component: RouteComponent
})

function RouteComponent() {
	const { data: timelineEntries } = useQuery(
		supabase
			.from('timeline_entries')
			.select('*, topics(name)')
			.not('completed_at', 'is', null)
			.order('completed_at', { ascending: false })
	)

	return (
		<div className='container mx-auto p-6'>
			<div className='mb-2'>
				<h1 className='font-bold text-3xl'>Logbook</h1>
			</div>

			<div className='space-y-0.5'>
				{timelineEntries?.map(entry => (
					<EntryItem entry={entry} isCompleted={true} key={entry.id} />
				))}
				{timelineEntries?.length === 0 && (
					<div className='py-12 text-center'>
						<p className='text-muted-foreground'>No completed entries yet.</p>
					</div>
				)}
			</div>
		</div>
	)
}
