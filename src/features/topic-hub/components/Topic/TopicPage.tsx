import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { use, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../stores/SelectedTopicContext'
import { TopicFamilyPanel } from './FamilyPanel'
import { TopicHeader } from './Header'
import { TopicPageSkeleton } from './TopicPageSkeleton'

export function TopicPage({ isLoading }: { isLoading: boolean }) {
	const { selectedTopic } = use(TopicHubContext)
	const notesRef = useRef<HTMLTextAreaElement>(null)

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

	// focus on notes whenever selected topic changes
	useEffect(() => {
		if (!isLoading && notesRef.current) {
			notesRef.current.focus()
		}
	}, [isLoading, selectedTopic?.id, notesRef])

	if (isLoading) {
		return <TopicPageSkeleton />
	}

	return (
		<div className='!pt-0 flex flex-1 flex-col items-center gap-4 sm:gap-6 sm:p-4 md:p-6'>
			<TopicFamilyPanel />

			<Card className='w-full flex-1'>
				<CardHeader>
					<TopicHeader />
				</CardHeader>
				<CardContent className='min-h-0 flex-1 px-4'>
					<Textarea
						className='!bg-transparent h-full w-full resize-none border-none shadow-none focus-visible:border-none focus-visible:ring-0'
						onChange={onNotesChange}
						placeholder='Notes'
						ref={notesRef}
						value={notes}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
