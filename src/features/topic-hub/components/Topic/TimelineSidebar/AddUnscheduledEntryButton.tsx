import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { Plus } from 'lucide-react'
import { use, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'

export function AddUnscheduledButton() {
	const { selectedTopic } = use(TopicHubContext)

	const { mutateAsync: insertTimelineEntry } = useInsertMutation(
		supabase.from('timeline_entries'),
		['id'],
		'*'
	)

	const handleAddTodo = useCallback(() => {
		if (!selectedTopic) return

		insertTimelineEntry([
			{
				description: '',
				topic_id: selectedTopic.id,
				scheduled_at: null,
				completed_at: null
			}
		])
	}, [selectedTopic, insertTimelineEntry])

	return (
		<Button onClick={handleAddTodo} size='sm' variant='ghost'>
			<Plus className='h-4 w-4' />
		</Button>
	)
}
