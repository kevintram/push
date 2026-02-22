import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

export function useNoteNavigation(): (noteId: number) => void {
	const navigate = useNavigate()

	return useCallback(
		(noteId: number) => {
			navigate({
				to: '/notes/$noteId',
				params: { noteId: noteId.toString() }
			})
		},
		[navigate]
	)
}
