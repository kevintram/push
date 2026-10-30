import { useMemo, useState } from 'react'

import { toast } from '~/components/ui/Toast'
import { todayIso } from '~/utils/date'

import { useCreateReview } from '../api/reviewQueries'
import {
	closedReviewComposerDock,
	emptyReviewDraft,
	ReviewComposerContext,
	type ReviewComposerDock,
	type ReviewComposerProviderProps,
	type ReviewComposerState,
} from './reviewComposerContext'

export function ReviewComposerProvider({
	cardId,
	children,
	defaultDock = closedReviewComposerDock,
	onDockChange,
}: ReviewComposerProviderProps) {
	const [draft, setDraft] = useState(emptyReviewDraft)
	const [dock, setLocalDock] = useState(defaultDock)
	const { isPending, mutate } = useCreateReview()
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
						onError: () =>
							toast.add({
								title: 'Failed to create review',
								type: 'error',
							}),
						onSuccess: () => {
							setDraft(emptyReviewDraft)
							setLocalDock(closedReviewComposerDock)
						},
					},
				)
			},
		}
	}, [cardId, dock, draft, isDirty, isPending, mutate, onDockChange])
	return (
		<ReviewComposerContext.Provider value={state}>
			{children}
		</ReviewComposerContext.Provider>
	)
}
