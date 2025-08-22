import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Checkbox } from '~/components/ui/Checkbox'
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
					<EntryItem entry={entry} key={entry.id} />
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

function EntryItem({ entry }: { entry: TimelineEntry }) {
	const scheduledDate = new Date(entry.scheduled_at).toLocaleDateString(
		'en-US',
		{
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		}
	)

	const isOverdue = new Date(entry.scheduled_at) < new Date()

	return (
		<div className='flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-muted/50'>
			<Checkbox
				className={`mt-1 ${isOverdue ? 'border-red-500 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500' : ''}`}
			/>
			<div className='min-w-0 flex-1'>
				<p className='mb-1 text-base leading-relaxed'>{entry.description}</p>
				<p className='text-muted-foreground text-sm'>{entry.topics.name}</p>
			</div>
			<div className='whitespace-nowrap text-muted-foreground text-sm'>
				{scheduledDate}
			</div>
		</div>
	)
}
