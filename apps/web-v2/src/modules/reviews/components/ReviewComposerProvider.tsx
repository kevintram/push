import { useEffect, useMemo, useState } from 'react'
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
	onDirtyChange,
	onCancel,
	onCreateSuccess,
	children,
}: ReviewComposerProviderProps) {
	const [draft, setDraft] = useState(emptyReviewDraft)
	const createReview = useCreateReview()
	const isDirty =
		draft.description !== '' ||
		draft.notes !== '' ||
		draft.rating !== null ||
		draft.date !== null
	useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange])
	const state = useMemo<ReviewComposerState>(
		() => ({
			draft,
			isPending: createReview.isPending,
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
			resetDraft: () => {
				setDraft(emptyReviewDraft)
				onCancel?.()
			},
			submit: composerSuccess => {
				if (!isDirty || createReview.isPending) return
				createReview.mutate(
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
							onCreateSuccess?.()
						},
					},
				)
			},
		}),
		[cardId, createReview, draft, isDirty, onCancel, onCreateSuccess],
	)
	return (
		<ReviewComposerContext.Provider value={state}>
			{children}
		</ReviewComposerContext.Provider>
	)
}
