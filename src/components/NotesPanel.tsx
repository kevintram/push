import type { Note } from '~/types/notes.types'
import { Card, CardContent } from './ui/Card'

function NotesPanel(props: { note: Note | undefined }) {
	return (
		<Card className='w-80 flex-none'>
			<CardContent className='h-full'>
				<div className='flex h-full flex-col'>
					<span className='text-sm leading-relaxed'>{props.note?.content}</span>
				</div>
			</CardContent>
		</Card>
	)
}

export { NotesPanel }
