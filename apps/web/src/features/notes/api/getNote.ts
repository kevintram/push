import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { NoteSchema } from '../types/note.schemas'
import type { Note } from '../types/note.types'
import { noteKeys } from './queryKeys'

export async function getNote(noteId: number): Promise<Note> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/notes/${noteId}/`
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

export function useNote(noteId: number | undefined) {
	return useQuery({
		queryKey:
			noteId !== undefined ? noteKeys.detail(noteId) : noteKeys.detail(-1),
		queryFn: () => getNote(noteId!),
		enabled: noteId !== undefined
	})
}
