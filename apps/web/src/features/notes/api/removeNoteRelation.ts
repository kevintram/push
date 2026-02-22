import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '~/utils/apiFetch'
import type {
	NoteRelationDirection,
	NoteRelationType
} from '../types/note.types'
import { noteKeys } from './queryKeys'

interface RemoveNoteRelationInput {
	noteId: number
	otherNoteId: number
	relationType: NoteRelationType
	direction?: NoteRelationDirection
}

async function removeNoteRelation({
	noteId,
	otherNoteId,
	relationType,
	direction = 'outgoing'
}: RemoveNoteRelationInput): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/notes/${noteId}/relations/${relationType}/${otherNoteId}/?direction=${direction}`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useRemoveNoteRelation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: removeNoteRelation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: noteKeys.all })
		}
	})
}
