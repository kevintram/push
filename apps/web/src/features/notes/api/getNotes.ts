import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import { NoteSchema } from '../types/note.schemas'
import type { GetNotesParams, Note } from '../types/note.types'
import { noteKeys } from './queryKeys'

export async function getNotes(
	params: GetNotesParams = {}
): Promise<Array<Note>> {
	const searchParams = new URLSearchParams()

	if (params.root !== undefined) {
		searchParams.append('root', String(params.root))
	}
	if (params.inboxed !== undefined) {
		searchParams.append('inboxed', String(params.inboxed))
	}
	if (params.archived !== undefined) {
		searchParams.append('archived', String(params.archived))
	}
	if (params.parent_id !== undefined) {
		searchParams.append('parent_id', String(params.parent_id))
	}
	if (params.tag !== undefined) {
		searchParams.append('tag', params.tag)
	}
	if (params.srs_enabled !== undefined) {
		searchParams.append('srs_enabled', String(params.srs_enabled))
	}
	if (params.order !== undefined) {
		searchParams.append('order', params.order)
	}
	if (params.limit !== undefined) {
		searchParams.append('limit', String(params.limit))
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/notes/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(NoteSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useNotes(
	params: GetNotesParams = {},
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: noteKeys.list(params),
		queryFn: () => getNotes(params),
		enabled: options?.enabled ?? true
	})
}
