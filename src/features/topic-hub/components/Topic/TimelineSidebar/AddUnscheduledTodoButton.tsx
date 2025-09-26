import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { Plus } from 'lucide-react'
import { use, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'

export function AddUnscheduledTodoButton() {
	const { selectedTopic } = use(TopicHubContext)

	const { mutateAsync: insertTodo } = useInsertMutation(
		supabase.from('todos'),
		['id'],
		'*'
	)

	const handleAddTodo = useCallback(() => {
		if (!selectedTopic) return

		insertTodo([
			{
				description: '',
				topic_id: selectedTopic.id,
				scheduled_at: null,
				completed_at: null
			}
		])
	}, [selectedTopic, insertTodo])

	return (
		<Button onClick={handleAddTodo} size='sm' variant='ghost'>
			<Plus className='h-4 w-4' />
		</Button>
	)
}
