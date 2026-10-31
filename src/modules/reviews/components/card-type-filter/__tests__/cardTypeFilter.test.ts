import { describe, expect, it } from 'vitest'

import type { Card } from '~/modules/reviews/types/review.types'

import { filterCardsByType } from '../cardTypeFilter'

function card(overrides: Partial<Card> = {}): Card {
	return {
		_creationTime: 0,
		_id: 'card-id' as Card['_id'],
		lastReview: undefined,
		notes: '',
		ownerId: 'user-id',
		primaryText: '',
		searchText: '',
		secondaryText: '',
		state: 'LEARNING',
		collectionId: 'collection-id' as Card['collectionId'],
		type: 'flashcard',
		...overrides,
	}
}

describe('filterCardsByType', () => {
	it('returns the same array reference for "all"', () => {
		const cards = [card({ type: 'practice' }), card({ type: 'flashcard' })]

		expect(filterCardsByType(cards, 'all')).toBe(cards)
	})

	it('keeps only flashcards for "flashcard"', () => {
		const flashcard = card({ _id: 'a' as Card['_id'], type: 'flashcard' })
		const practice = card({ _id: 'b' as Card['_id'], type: 'practice' })

		expect(filterCardsByType([flashcard, practice], 'flashcard')).toEqual([
			flashcard,
		])
	})

	it('keeps only non-flashcards for "not-flashcard"', () => {
		const flashcard = card({ _id: 'a' as Card['_id'], type: 'flashcard' })
		const practice = card({ _id: 'b' as Card['_id'], type: 'practice' })

		expect(
			filterCardsByType([flashcard, practice], 'not-flashcard'),
		).toEqual([practice])
	})

	it('returns an empty array when input is empty', () => {
		expect(filterCardsByType([], 'flashcard')).toEqual([])
		expect(filterCardsByType([], 'not-flashcard')).toEqual([])
	})

	it('returns the same empty array reference for "all"', () => {
		const cards: Array<Card> = []

		expect(filterCardsByType(cards, 'all')).toBe(cards)
	})
})
