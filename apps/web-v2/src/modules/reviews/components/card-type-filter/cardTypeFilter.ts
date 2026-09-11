import type { Card } from '~/modules/reviews/types/review.types'

export type CardTypeFilter = 'all' | 'flashcard' | 'not-flashcard'

export const CARD_TYPE_FILTER_OPTIONS: ReadonlyArray<{
	value: CardTypeFilter
	label: string
}> = [
	{ value: 'all', label: 'All' },
	{ value: 'flashcard', label: 'Flashcards' },
	{ value: 'not-flashcard', label: 'Not flashcards' },
]

export function filterCardsByType(
	cards: ReadonlyArray<Card>,
	filter: CardTypeFilter,
): ReadonlyArray<Card> {
	if (filter === 'all') return cards
	if (filter === 'flashcard') {
		return cards.filter(card => card.type === 'flashcard')
	}
	return cards.filter(card => card.type !== 'flashcard')
}
