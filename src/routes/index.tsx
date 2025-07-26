import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LibrarySidebar } from '~/components/LibrarySidebar'
import { NotesPanel } from '~/components/NotesPanel'
import { PracticePanel } from '~/components/PracticePanel'
import { TopicHeader } from '~/components/TopicHeader'
import type { Note } from '~/types/notes'
import { supabase } from '~/utils/supabase'

export const Route = createFileRoute('/')({
	component: Library
})

function Library() {
	const [notes, setNotes] = useState<Array<Note>>()
	const [selected, setSelected] = useState<Note>()

	useEffect(() => {
		function getNotes() {
			supabase
				.from('notes')
				.select('*, practice(*)')
				.then(({ data }) => {
					if (data !== null) {
						setNotes(data)
					}
				})
		}

		getNotes()
	})
	
	const onNoteSelected = (note: Note) => {
		setSelected(note)
	}

	return (
		<div className='flex h-screen w-full'>
			<LibrarySidebar notes={notes} onNoteSelected={onNoteSelected}/>
			<div className='flex flex-1 flex-col gap-4 overflow-auto p-4'>
				<TopicHeader tags={[]} title={selected?.title ?? ''} />
				<div className='flex w-full flex-1 gap-4'>
					<PracticePanel practice={selected?.practice} />
					<NotesPanel note={selected} />
				</div>
			</div>
		</div>
	)
}
