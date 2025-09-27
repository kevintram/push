import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { createFileRoute } from '@tanstack/react-router'
import { TodoItem } from '~/components/TodoItem'
import { supabase } from '~/utils/supabase'

export const Route = createFileRoute('/logbook')({
	component: RouteComponent
})

function RouteComponent() {
	const { data: todos } = useQuery(
		supabase
			.from('todos')
			.select('*, todos_topics(topics(id, name))')
			.not('completed_at', 'is', null)
			.order('completed_at', { ascending: false })
	)

	return (
		<div className='container mx-auto p-6'>
			<div className='mb-2'>
				<h1 className='font-bold text-3xl'>Logbook</h1>
			</div>

			<div className='space-y-0.5'>
				{todos?.map(entry => (
					<TodoItem entry={entry} isCompleted={true} key={entry.id} />
				))}
				{todos?.length === 0 && (
					<div className='py-12 text-center'>
						<p className='text-muted-foreground'>No completed entries yet.</p>
					</div>
				)}
			</div>
		</div>
	)
}
