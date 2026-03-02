import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { NoteSchema } from '../types/note.schemas'
import type { Note, NoteTag } from '../types/note.types'
import { noteKeys } from './queryKeys'

export interface CreateNoteInput {
	title?: string
	body?: string
	parent_id?: number | null
	archived?: boolean
	tags?: Array<NoteTag>
	srs_enabled?: boolean
}

async function createNote(input: CreateNoteInput): Promise<Note> {
	const response = await apiFetch(`${import.meta.env.VITE_API_URL}/notes/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(input)
	})

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

export function useCreateNote() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createNote,
		onSuccess: note => {
			queryClient.setQueryData(noteKeys.detail(note.id), note)
			return queryClient.invalidateQueries({ queryKey: noteKeys.all })
		}
	})
}
