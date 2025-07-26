import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LibrarySidebar } from '~/components/LibrarySidebar'
import { NotesPanel } from '~/components/NotesPanel'
import { PracticePanel } from '~/components/PracticePanel'
import { TopicHeader } from '~/components/TopicHeader'
import type { Note } from '~/types/note'
import { supabase } from '~/utils/supabase'

export const Route = createFileRoute('/')({
	component: Library
})

const notes: Array<Note> = [
	{
		title: 'Introduction to Neural Networks',
		content:
			'Neural networks are computational systems inspired by the biological neural networks that constitute animal brains. The connections between neurons are modeled as weights that can be tuned based on experience, making neural networks capable of adaptive learning',
		practiceElements: [
			'What is the primary inspiration for artificial neural networks? Please explain in great detail!',
			'Define weights in the context of neural networks',
			'Explain how neural networks learn from experience',
			'AHHHHHHHH',
			'What is the primary inspiration for artificial neural networks? Please explain in great detail!',
			'Define weights in the context of neural networks',
			'Explain how neural networks learn from experience',
			'AHHHHHHHH'
		],
		tags: ['Machine Learning/Deep Learning']
	},
	{
		title: 'Backpropagation Explained',
		content: 'Understanding how neural networks learn through...',
		practiceElements: [],
		tags: []
	},
	{
		title: 'Activation Functions',
		content: 'Different types of activation functions and their...',
		practiceElements: [],
		tags: []
	}
]

function Library() {
	const [selected, _setSelected] = useState<Note>(notes[0]!)
	
	useEffect(() => {
		async function getNotes() {
			const { data: dbNotes } = await supabase.from('notes').select();
			
			console.log(dbNotes)
		}
		
		getNotes()
	})

	return (
		<div className='flex h-screen w-full'>
			<LibrarySidebar notes={notes} />
			<div className='flex flex-1 flex-col gap-4 overflow-auto p-4'>
				<TopicHeader tags={selected.tags} title={selected.title} />
				<div className='flex w-full flex-1 gap-4'>
					<PracticePanel practiceElements={selected.practiceElements} />
					<NotesPanel content={selected.content} />
				</div>
			</div>
		</div>
	)
}
