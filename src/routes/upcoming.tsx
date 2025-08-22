import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { createFileRoute } from '@tanstack/react-router'
import { EntryItem } from '~/components/EntryItem'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

export const Route = createFileRoute('/upcoming')({
	component: RouteComponent
})

type TimelineEntry = Tables<'timeline_entries'> & { topics: { name: string } }

function RouteComponent() {
	const { data: timelineEntries } = useQuery(
		supabase
			.from('timeline_entries')
			.select('*, topics(name)')
			.is('completed_at', null)
			.order('scheduled_at', { ascending: true })
	)

	return (
		<div className='container mx-auto p-6'>
			<div className='mb-2'>
				<h1 className='font-bold text-3xl'>Scheduled</h1>
			</div>

			<div className='space-y-0.5'>
				{timelineEntries?.map(entry => (
					<EntryItem entry={entry} key={entry.id} isCompleted={false} />
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

