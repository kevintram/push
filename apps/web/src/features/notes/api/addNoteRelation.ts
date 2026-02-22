import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '~/utils/apiFetch'
import type { NoteRelationType } from '../types/note.types'
import { noteKeys } from './queryKeys'

interface AddNoteRelationInput {
	noteId: number
	toId: number
	relationType: NoteRelationType
}

async function addNoteRelation({
	noteId,
	toId,
	relationType
}: AddNoteRelationInput): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/notes/${noteId}/relations/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				to_id: toId,
				relation_type: relationType
			})
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useAddNoteRelation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: addNoteRelation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: noteKeys.all })
		}
	})
}
