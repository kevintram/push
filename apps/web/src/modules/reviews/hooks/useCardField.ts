import type { Id } from '@convex/_generated/dataModel'
import { useCallback } from 'react'

import { useAutoSave } from '~/hooks/useAutoSave'

import { useUpdateCard } from '../api/cardQueries'

/** The card fields that are edited as free text. */
type EditableCardField = 'notes' | 'primaryText' | 'secondaryText'

type UseCardFieldOptions = {
	field: EditableCardField
	cardId: Id<'cards'>
	/** The value currently persisted for this field. */
	value: string
}

/**
 * Binds one free-text field of a card to an autosaving textarea.
 *
 * The autosave key covers both the card and the field, so moving to another
 * card flushes the pending save against the card the text was typed into rather
 * than the one now on screen.
 */
export function useCardField({ field, cardId, value }: UseCardFieldOptions) {
	const updateCard = useUpdateCard()

	const onSave = useCallback(
		(nextValue: string) => {
			if (nextValue === value) return

			// Named so the patch keeps the mutation's optional-field types
			// instead of widening to a string index signature.
			const patch: Partial<Record<EditableCardField, string>> = {
				[field]: nextValue,
			}

			// TODO(3): a card deleted while an edit is queued reports a
			// failure the user did not cause. `useAutoSave` flushes pending
			// saves on unmount, so the save lands on a missing document and
			// `requireOwnedCard` throws. Reachable when the delete
			// happens in another tab: nothing blurs the textarea first, so
			// the debounce is still pending when Convex pushes the removal
			// and this page unmounts. Needs a `cancel` on `useAutoSave`
			// invoked before the delete; matching on the thrown message
			// would be brittle.
			updateCard.mutate({ cardId, ...patch })
		},
		[field, cardId, updateCard, value],
	)

	return useAutoSave({
		initialValue: value,
		key: `${cardId}:${field}`,
		onSave,
	})
}
