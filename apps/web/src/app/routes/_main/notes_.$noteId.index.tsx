import { createFileRoute } from '@tanstack/react-router'
import { NoteDetailPage } from '~/app/pages/NoteDetailPage'

export const Route = createFileRoute('/_main/notes_/$noteId/')({
	component: RouteComponent
})

function RouteComponent() {
	const { noteId } = Route.useParams()
	return <NoteDetailPage noteId={noteId} />
}
