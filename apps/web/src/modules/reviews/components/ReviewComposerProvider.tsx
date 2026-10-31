import { useEffect, useMemo, useRef, useState } from 'react'

import type { DateString } from '~/types/date'
import { todayIso } from '~/utils/date'

import { useCreateReview } from '../api/reviewQueries'
import {
	closedReviewComposerDock,
	emptyReviewDraft,
	ReviewComposerContext,
	type ReviewComposerDock,
	type ReviewComposerFocusTarget,
	type ReviewComposerProviderProps,
	type ReviewComposerState,
	type ReviewDraft,
} from './reviewComposerContext'

const openReviewComposerDock: ReviewComposerDock = {
	state: 'open',
	isExpanded: false,
}

export function ReviewComposerProvider({
	cardId,
	children,
	defaultDock = closedReviewComposerDock,
	onDockChange,
	restoredDraft,
	onReviewUndone,
}: ReviewComposerProviderProps) {
	const [draft, setDraft] = useState(restoredDraft ?? emptyReviewDraft)
	const [dock, setLocalDock] = useState(
		restoredDraft ? openReviewComposerDock : defaultDock,
	)
	const [focusRequest, setFocusRequest] =
		useState<ReviewComposerFocusTarget | null>(null)
	// An undo can land after this composer is gone, as when the review queue
	// has moved on from the reviewed card.
	const isMounted = useRef(false)
	useEffect(() => {
		isMounted.current = true
		return () => {
			isMounted.current = false
		}
	}, [])
	const { isPending, mutate } = useCreateReview({
		onUndone: review => {
			const undone: ReviewDraft = {
				description: review.description ?? '',
				notes: review.notes ?? '',
				rating: review.rating ?? null,
				// The composer only ever submits a `DateString`.
				date: (review.date as DateString | undefined) ?? null,
			}
			if (isMounted.current) {
				setDraft(undone)
				setLocalDock(openReviewComposerDock)
			} else {
				onReviewUndone?.(undone)
			}
		},
	})
	const isDirty =
		draft.description !== '' ||
		draft.notes !== '' ||
		draft.rating !== null ||
		draft.date !== null
	const state = useMemo<ReviewComposerState>(() => {
		const moveDock = (next: ReviewComposerDock) => {
			setLocalDock(next)
			onDockChange?.(next)
		}
		return {
			draft,
			isPending,
			isDirty,
			dock,
			setDockState: value =>
				moveDock(
					value === 'closed'
						? closedReviewComposerDock
						: { ...dock, state: value },
				),
			openComposer: target => {
				moveDock({ ...dock, state: 'open' })
				setFocusRequest(target)
			},
			focusRequest,
			clearFocusRequest: () => setFocusRequest(null),
			setExpanded: value =>
				moveDock({ state: 'open', isExpanded: value }),
			setDescription: value =>
				setDraft(p => ({ ...p, description: value })),
			setNotes: value => setDraft(p => ({ ...p, notes: value })),
			setRating: value =>
				setDraft(p => ({
					...p,
					rating: value,
					date:
						value !== null && p.rating === null
							? todayIso()
							: p.date,
				})),
			setDate: value => setDraft(p => ({ ...p, date: value })),
			resetDraft: () => setDraft(emptyReviewDraft),
			submit: () => {
				if (!isDirty || isPending) return
				mutate(
					{
						cardId,
						description: draft.description,
						notes: draft.notes,
						...(draft.rating === null
							? {}
							: { rating: draft.rating }),
						...(draft.date === null ? {} : { date: draft.date }),
					},
					{
						onSuccess: () => {
							setDraft(emptyReviewDraft)
							setLocalDock(closedReviewComposerDock)
						},
					},
				)
			},
		}
	}, [
		cardId,
		dock,
		draft,
		focusRequest,
		isDirty,
		isPending,
		mutate,
		onDockChange,
	])
	return (
		<ReviewComposerContext.Provider value={state}>
			{children}
		</ReviewComposerContext.Provider>
	)
}
