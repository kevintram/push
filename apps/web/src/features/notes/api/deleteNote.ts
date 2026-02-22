import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '~/utils/apiFetch'
import { noteKeys } from './queryKeys'

export async function deleteNote(id: number) {
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/notes/${id}/`,
		{
			method: 'DELETE'
		}
	)

	if (!response.ok) {
		let message = `API request failed: ${response.status}`
		try {
			const data = await response.json()
			if (typeof data?.detail === 'string' && data.detail.trim()) {
				message = data.detail
			}
		} catch {
			// Ignore JSON parse issues and keep fallback message.
		}
		throw new Error(message)
	}

	return null
}

export function useDeleteNote() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteNote,
		onSuccess: async (_, id) => {
			queryClient.removeQueries({ queryKey: noteKeys.detail(id), exact: true })
			await queryClient.invalidateQueries({ queryKey: noteKeys.all })
		}
	})
}
