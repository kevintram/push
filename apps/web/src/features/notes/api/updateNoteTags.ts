import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '~/utils/apiFetch'
import type { NoteTag } from '../types/note.types'
import { noteKeys } from './queryKeys'

interface UpdateNoteTagInput {
	noteId: number
	tag: NoteTag
}

async function addNoteTag({
	noteId,
	tag
}: UpdateNoteTagInput): Promise<Array<NoteTag>> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/notes/${noteId}/tags/`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ tag })
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	return data as Array<NoteTag>
}

async function removeNoteTag({
	noteId,
	tag
}: UpdateNoteTagInput): Promise<void> {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/notes/${noteId}/tags/${tag}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}
}

export function useAddNoteTag() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: addNoteTag,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: noteKeys.all })
		}
	})
}

export function useRemoveNoteTag() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: removeNoteTag,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: noteKeys.all })
		}
	})
}
