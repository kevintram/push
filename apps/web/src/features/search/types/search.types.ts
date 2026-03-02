import type { Note } from '~/features/notes/types/note.types'

export type SearchResultItem = {
	entity_type: 'note'
	note: Note
	recent_activity_at: string
}

export type SearchAllParams = {
	query?: string
	entityTypes?: string
	archived?: boolean
	limit?: number
}
