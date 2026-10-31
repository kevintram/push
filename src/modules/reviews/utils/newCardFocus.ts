import type { Id } from '@convex/_generated/dataModel'

// Cards created here whose page hasn't opened yet. Kept outside React and the
// URL, since it only has to survive the navigation to the new card.
const awaitingFocus = new Set<Id<'cards'>>()

/** Marks a just-created card so its page focuses the prompt when it opens. */
export function focusPromptWhenOpened(cardId: Id<'cards'>) {
	awaitingFocus.add(cardId)
}

/** Whether `cardId`'s prompt should take focus, which only happens once. */
export function takePromptFocus(cardId: Id<'cards'>): boolean {
	return awaitingFocus.delete(cardId)
}
