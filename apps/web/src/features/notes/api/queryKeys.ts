import type { GetNotesParams } from '../types/note.types'

export const noteKeys = {
	all: ['notes'] as const,
	list: (params: GetNotesParams = {}) =>
		[...noteKeys.all, 'list', params] as const,
	detail: (id: number) => [...noteKeys.all, 'detail', id] as const,
	relations: (
		noteId: number,
		params: {
			relationType?: 'RELATED' | 'PREREQUISITE' | 'COVERS' | 'ASSESSES'
			direction?: 'outgoing' | 'incoming'
		} = {}
	) => [...noteKeys.all, 'relations', noteId, params] as const
}
