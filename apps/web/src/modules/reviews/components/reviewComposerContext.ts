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
/** Where the card's docked composer is showing, if at all. */
export type ReviewComposerDockState =
	| 'closed'
	| 'open'
	| 'minimized'
	| 'expanded'
export type ReviewComposerState = {
	draft: ReviewDraft
	isPending: boolean
	isDirty: boolean
	dockState: ReviewComposerDockState
	setDockState: (value: ReviewComposerDockState) => void
	setDescription: (value: string) => void
	setNotes: (value: string) => void
	setRating: (value: Rating | null) => void
	setDate: (value: DateString | null) => void
	resetDraft: () => void
	submit: () => void
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
/** Lets a parent carry the dock's state from one card to the next. */
export type ReviewComposerDockProps = {
	/** Where the dock starts. Defaults to closed. */
	defaultDockState?: ReviewComposerDockState
	/**
	 * Called when the user moves the dock. Creating a review closes the dock
	 * without calling this, since that isn't a choice to hide it.
	 */
	onDockStateChange?: (value: ReviewComposerDockState) => void
}
export type ReviewComposerProviderProps = ReviewComposerDockProps & {
	cardId: Id<'cards'>
	children: React.ReactNode
}
