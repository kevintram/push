import { useRevalidateTables } from '@supabase-cache-helpers/postgrest-react-query'
import { Plus } from 'lucide-react'
import { use, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'

export function AddUnscheduledTodoButton() {
	const { selectedTopic } = use(TopicHubContext)

	const revalidateTables = useRevalidateTables([
		{ schema: 'public', table: 'todos' },
		{ schema: 'public', table: 'todos_today' },
		{ schema: 'public', table: 'todos_with_effective_date' },
		{ schema: 'public', table: 'todos_topics' }
	])

	const handleAddTodo = useCallback(async () => {
		if (!selectedTopic) return

		await supabase.rpc('insert_todo_with_topics', {
			p_todo_description: '',
			p_todo_scheduled_at: null as any,
			p_todo_completed_at: null as any,
			p_topic_ids: [selectedTopic.id]
		})

		// Revalidate cache to update UI
		revalidateTables()
	}, [selectedTopic, revalidateTables])

	return (
		<Button onClick={handleAddTodo} size='sm' variant='ghost'>
			<Plus className='h-4 w-4' />
		</Button>
	)
}
