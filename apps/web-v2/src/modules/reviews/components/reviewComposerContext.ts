import type { Id } from '@convex/_generated/dataModel'
import { createContext, useContext } from 'react'

import type { DateString } from '~/types/date'

import type { Rating } from '../types/review.types'

export type ReviewDraft = {
	description: string
	notes: string
	rating: Rating | null
	date: DateString | null
}
export const emptyReviewDraft: ReviewDraft = {
	description: '',
	notes: '',
	rating: null,
	date: null,
}
export type ReviewComposerState = {
	draft: ReviewDraft
	isPending: boolean
	isDirty: boolean
	setDescription: (value: string) => void
	setNotes: (value: string) => void
	setRating: (value: Rating | null) => void
	setDate: (value: DateString | null) => void
	resetDraft: () => void
	submit: (onSuccess?: () => void) => void
}
export const ReviewComposerContext = createContext<ReviewComposerState | null>(
	null,
)
export function useReviewComposerState() {
	const state = useContext(ReviewComposerContext)
	if (!state)
		throw new Error('ReviewComposer requires ReviewComposerProvider')
	return state
}
export type ReviewComposerProviderProps = {
	cardId: Id<'cards'>
	onDirtyChange?: (dirty: boolean) => void
	onCancel?: () => void
	onCreateSuccess?: () => void
	children: React.ReactNode
}
