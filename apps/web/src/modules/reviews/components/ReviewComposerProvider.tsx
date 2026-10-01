import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { todayIso } from '~/utils/date'

import { useCreateReview } from '../api/reviewQueries'
import {
	emptyReviewDraft,
	ReviewComposerContext,
	type ReviewComposerProviderProps,
	type ReviewComposerState,
} from './reviewComposerContext'

export function ReviewComposerProvider({
	cardId,
	children,
}: ReviewComposerProviderProps) {
	const [draft, setDraft] = useState(emptyReviewDraft)
	const { isPending, mutate } = useCreateReview()
	const isDirty =
		draft.description !== '' ||
		draft.notes !== '' ||
		draft.rating !== null ||
		draft.date !== null
	const state = useMemo<ReviewComposerState>(
		() => ({
			draft,
			isPending,
			isDirty,
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
			submit: composerSuccess => {
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
						onError: () => toast.error('Failed to create review'),
						onSuccess: () => {
							setDraft(emptyReviewDraft)
							composerSuccess?.()
						},
					},
				)
			},
		}),
		[cardId, draft, isDirty, isPending, mutate],
	)
	return (
		<ReviewComposerContext.Provider value={state}>
			{children}
		</ReviewComposerContext.Provider>
	)
}
