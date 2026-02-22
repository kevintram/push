import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { NoteRelationListItemSchema } from '../types/note.schemas'
import type {
	NoteRelationDirection,
	NoteRelationListItem,
	NoteRelationType
} from '../types/note.types'
import { noteKeys } from './queryKeys'

interface GetNoteRelationsParams {
	relationType?: NoteRelationType
	direction?: NoteRelationDirection
}

export async function getNoteRelations(
	noteId: number,
	params: GetNoteRelationsParams = {}
): Promise<Array<NoteRelationListItem>> {
	const searchParams = new URLSearchParams()
	if (params.relationType) {
		searchParams.append('relation_type', params.relationType)
	}
	if (params.direction) {
		searchParams.append('direction', params.direction)
	}

	const query = searchParams.toString()
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/notes/${noteId}/relations/${query ? `?${query}` : ''}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(NoteRelationListItemSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useNoteRelations(
	noteId: number | undefined,
	params: GetNoteRelationsParams = {}
) {
	return useQuery({
		queryKey:
			noteId !== undefined
				? noteKeys.relations(noteId, {
						relationType: params.relationType,
						direction: params.direction
					})
				: noteKeys.relations(-1, {
						relationType: params.relationType,
						direction: params.direction
					}),
		queryFn: () => getNoteRelations(noteId!, params),
		enabled: noteId !== undefined
	})
}
