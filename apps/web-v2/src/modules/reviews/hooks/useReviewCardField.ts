import type { Id } from '@convex/_generated/dataModel'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { useAutoSave } from '~/hooks/useAutoSave'

import { useUpdateReviewCard } from '../api/reviewCardQueries'

/** The review-card fields that are edited as free text. */
type EditableReviewCardField = 'notes' | 'primaryText' | 'secondaryText'

type UseReviewCardFieldOptions = {
	/** Shown when the save fails. */
	errorMessage: string
	field: EditableReviewCardField
	reviewCardId: Id<'reviewCards'>
	/** The value currently persisted for this field. */
	value: string
}

/**
 * Binds one free-text field of a review card to an autosaving textarea.
 *
 * The autosave key covers both the card and the field, so moving to another
 * card flushes the pending save against the card the text was typed into rather
 * than the one now on screen.
 */
export function useReviewCardField({
	errorMessage,
	field,
	reviewCardId,
	value,
}: UseReviewCardFieldOptions) {
	const updateReviewCard = useUpdateReviewCard()

	const onSave = useCallback(
		async (nextValue: string) => {
			if (nextValue === value) return

			// Named so the patch keeps the mutation's optional-field types
			// instead of widening to a string index signature.
			const patch: Partial<Record<EditableReviewCardField, string>> = {
				[field]: nextValue,
			}

			try {
				await updateReviewCard.mutateAsync({ reviewCardId, ...patch })
			} catch {
				// TODO(3): a card deleted while an edit is queued reports a
				// failure the user did not cause. `useAutoSave` flushes pending
				// saves on unmount, so the save lands on a missing document and
				// `requireOwnedReviewCard` throws. Reachable when the delete
				// happens in another tab: nothing blurs the textarea first, so
				// the debounce is still pending when Convex pushes the removal
				// and this page unmounts. Needs a `cancel` on `useAutoSave`
				// invoked before the delete; matching on the thrown message
				// would be brittle.
				toast.error(errorMessage)
			}
		},
		[errorMessage, field, reviewCardId, updateReviewCard, value],
	)

	return useAutoSave({
		initialValue: value,
		key: `${reviewCardId}:${field}`,
		onSave,
	})
}
