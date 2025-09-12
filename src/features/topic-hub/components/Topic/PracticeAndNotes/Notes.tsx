import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { use, useCallback } from 'react'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../../stores/SelectedTopicContext'

export function Notes() {
	const { selectedTopic } = use(TopicHubContext)

	const { mutateAsync: updateTopicMutation } = useUpdateMutation(
		supabase.from('topics'),
		['id'],
		'*'
	)

	const updateNotesMutation = useCallback(
		(newNotes: string) => {
			if (selectedTopic?.id) {
				updateTopicMutation({ id: selectedTopic.id, notes: newNotes })
			}
		},
		[updateTopicMutation, selectedTopic?.id]
	)

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: selectedTopic?.notes ?? '',
		onSave: updateNotesMutation,
		key: `topics-${selectedTopic?.id}`
	})

	return (
		<Textarea
			className='!bg-transparent h-full resize-none border-none shadow-none focus-visible:border-none focus-visible:ring-0'
			onChange={onNotesChange}
			placeholder='Notes...'
			value={notes}
		/>
	)
}
