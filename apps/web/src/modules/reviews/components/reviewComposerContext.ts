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
/** How much of the card's composer is showing. */
export type ReviewComposerDockState = 'closed' | 'open' | 'minimized'
export type ReviewComposerDock = {
	state: ReviewComposerDockState
	/**
	 * Shows the open composer as a dialog instead of docked. Survives
	 * minimizing, so restoring returns to the dialog, and resets on close.
	 */
	isExpanded: boolean
}
export const closedReviewComposerDock: ReviewComposerDock = {
	state: 'closed',
	isExpanded: false,
}
export type ReviewComposerState = {
	draft: ReviewDraft
	isPending: boolean
	isDirty: boolean
	dock: ReviewComposerDock
	setDockState: (value: ReviewComposerDockState) => void
	setExpanded: (value: boolean) => void
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
	defaultDock?: ReviewComposerDock
	/**
	 * Called when the user moves the dock. Creating a review closes the dock
	 * without calling this, since that isn't a choice to hide it.
	 */
	onDockChange?: (value: ReviewComposerDock) => void
}
export type ReviewComposerProviderProps = ReviewComposerDockProps & {
	cardId: Id<'cards'>
	children: React.ReactNode
}
