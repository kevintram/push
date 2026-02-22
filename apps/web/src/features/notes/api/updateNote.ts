import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { NoteSchema } from '../types/note.schemas'
import type { Note, UpdateNoteInput } from '../types/note.types'
import { noteKeys } from './queryKeys'

async function updateNote(input: UpdateNoteInput): Promise<Note> {
	const { id, ...payload } = input

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/notes/${id}/`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(NoteSchema, data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useUpdateNote() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateNote,
		onSuccess: note => {
			queryClient.setQueryData(noteKeys.detail(note.id), note)
			return queryClient.invalidateQueries({ queryKey: noteKeys.all })
		}
	})
}
