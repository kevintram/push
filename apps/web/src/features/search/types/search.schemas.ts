import * as v from 'valibot'
import { NoteSchema } from '~/features/notes/types/note.schemas'
import type { SearchResultItem } from './search.types'

export const SearchResultItemSchema: v.GenericSchema<SearchResultItem> =
	v.object({
		entity_type: v.literal('note'),
		note: v.lazy(() => NoteSchema),
		recent_activity_at: v.string()
	})
