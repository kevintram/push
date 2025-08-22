import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import debounce from 'lodash.debounce'
import { use, useCallback, useEffect, useState } from 'react'
import { Textarea } from '~/components/ui/Textarea'
import { supabase } from '~/utils/supabase'
import { SelectedTopicContext } from '../stores/SelectedTopicContext'

export function Notes() {
	const { selectedTopic } = use(SelectedTopicContext)
	const [notes, setNotes] = useState(selectedTopic?.notes ?? '')

	useEffect(() => {
		setNotes(selectedTopic?.notes ?? '')
	}, [selectedTopic?.notes])

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

	const onNotesChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setNotes(e.target.value)
			debounce(updateNotesMutation, 1000)(e.target.value)
		},
		[updateNotesMutation]
	)

	return (
		<Textarea
			className='h-full resize-none'
			onChange={onNotesChange}
			placeholder='Add notes here...'
			value={notes}
		/>
	)
}
