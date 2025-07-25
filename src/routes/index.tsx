import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { LibrarySidebar } from '~/components/LibrarySidebar'
import { NotesPanel } from '~/components/NotesPanel'
import { PracticePanel } from '~/components/PracticePanel'
import { TopicHeader } from '~/components/TopicHeader'
import type { Note } from '~/types/note'

export const Route = createFileRoute('/')({
	component: Library
})

const notes: Array<Note> = [
		{
			title: 'Introduction to Neural Networks',
			content:
				'Neural networks are computational systems inspired by the biological neural networks that constitute animal brains. The connections between neurons are modeled as weights that can be tuned based on experience, making neural networks capable of adaptive learning',
			practiceElements: [
				'What is the primary inspiration for artificial neural networks?',
				'Define weights in the context of neural networks',
				'Explain how neural networks learn from experience'
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
	const [selected, setSelected] = useState<Note>(notes[0]!)

	return (
		<div className='flex h-screen w-full'>
			<LibrarySidebar notes={notes}/>
			<div className='flex flex-1 flex-col gap-4 overflow-auto p-4'>
				<TopicHeader title={selected.title} tags={selected.tags}/>
				<div className='flex w-full flex-1 gap-4'>
					<PracticePanel practiceElements={selected.practiceElements}/>
					<NotesPanel content={selected.content} />
				</div>
			</div>
		</div>
	)
}
