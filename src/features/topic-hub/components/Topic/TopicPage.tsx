import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { use, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../stores/SelectedTopicContext'
import { TopicChildrenPanel } from './FamilyPanel/TopicChildrenPanel'
import { TopicParentsPanel } from './FamilyPanel/TopicParentsPanel'
import { TopicHeader } from './Header'
import { TopicPageSkeleton } from './TopicPageSkeleton'

export function TopicPage({ isLoading }: { isLoading: boolean }) {
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

	if (isLoading) {
		return <TopicPageSkeleton />
	}
	const notesRef = useRef<HTMLTextAreaElement>(null)
	// focus on notes whenever selected topic changes
	useEffect(() => {
		if (notesRef.current) {
			notesRef.current.focus()
		}
	}, [selectedTopic?.id, notesRef])

	return (
		<div className='!pt-0 flex flex-1 flex-col items-center gap-4 sm:gap-6 sm:p-4 md:p-6'>
			<div className='w-full'>
				<TopicParentsPanel />
			</div>

			<Card className='w-full'>
				<CardHeader>
					<TopicHeader />
				</CardHeader>
				<CardContent className='min-h-96 px-4'>
					<Textarea
						className='!bg-transparent h-full w-full resize-none border-none shadow-none focus-visible:border-none focus-visible:ring-0'
						name='notes'
						onChange={onNotesChange}
						placeholder='Notes'
						ref={notesRef}
						value={notes}
					/>
				</CardContent>
			</Card>

			<div className='w-full'>
				<TopicChildrenPanel />
			</div>
		</div>
	)
}
