import type { Note, NoteStatusBadge } from '~/features/notes/types/note.types'

export type ReviewQueueItem = {
	queue_type: 'due' | 'hazy'
	entity_type: 'note'
	note: Note
	review_id?: number | null
	scheduled_at?: string | null
	days_until_due?: number | null
	days_until_hazy?: number | null
	status_badges?: Array<NoteStatusBadge>
}

export type ReviewQueuePage = {
	items: Array<ReviewQueueItem>
	next_cursor: string | null
	as_of: string
}
