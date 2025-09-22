import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { use, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../stores/SelectedTopicContext'
import { TopicChildrenPanel } from './FamilyPanel/TopicChildrenPanel'
import { TopicParentsPanel } from './FamilyPanel/TopicParentsPanel'
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

	const updateNameMutation = useCallback(
		(newTitle: string) => {
			if (!selectedTopic) return
			updateTopicMutation({ id: selectedTopic.id, name: newTitle })
		},
		[updateTopicMutation, selectedTopic]
	)

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: selectedTopic?.notes ?? '',
		onSave: updateNotesMutation,
		key: `topics-${selectedTopic?.id}`
	})

	const { value: title, onChange: onNameChange } = useAutoSave({
		initialValue: selectedTopic?.name ?? '',
		onSave: updateNameMutation,
		key: `topics-${selectedTopic?.id}`
	})

	const textareaRef = useAutoResizeTextarea(title)

	const notesRef = useRef<HTMLTextAreaElement>(null)

	// focus on notes whenever selected topic changes
	useEffect(() => {
		if (notesRef.current) {
			notesRef.current.focus()
		}
	}, [selectedTopic?.id])

	if (isLoading) {
		return <TopicPageSkeleton />
	}

	return (
		<div className='!pt-0 flex flex-1 flex-col items-center gap-4 sm:gap-6 sm:p-4 md:p-6'>
			<div className='w-full'>
				<TopicParentsPanel />
			</div>

			<Card className='w-full gap-0'>
				<CardHeader>
					<textarea
						className='!bg-transparent break-word w-full resize-none border-none font-bold text-xl focus:outline-none sm:flex-1 sm:pr-4 sm:text-2xl md:text-3xl'
						onChange={onNameChange}
						placeholder='Title'
						ref={textareaRef}
						rows={1}
						spellCheck={false}
						value={title}
					/>
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
