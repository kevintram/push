import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'
import { describe, expect, it } from 'vitest'

import type { Card } from '~/modules/reviews/types/review.types'

import type { GroupedCards } from '../groupCardsBySection'
import { countItems, nameItems, selectionContents } from '../selectionContents'

const card = (id: string) => ({ _id: id as Id<'cards'> }) as Card
const section = (id: string) => ({ _id: id as Id<'sections'> }) as Section
const ids = (items: ReadonlyArray<{ _id: string }>) =>
	items.map(item => item._id)

// u1 | A: a1 a2 | B: b1
const grouped: GroupedCards = {
	unsectioned: [card('u1')],
	sections: [
		{ section: section('A'), cards: [card('a1'), card('a2')] },
		{ section: section('B'), cards: [card('b1')] },
	],
}

describe('selectionContents', () => {
	it("counts a selected section's cards, but leaves them out of its own cards", () => {
		const contents = selectionContents(
			grouped,
			new Set(['A' as Id<'sections'>]),
			// a1 is inside the selected section, and b1 is not.
			new Set(['b1', 'a1', 'u1'] as Array<Id<'cards'>>),
		)

		expect(ids(contents.sections)).toEqual(['A'])
		expect(ids(contents.cards)).toEqual(['u1', 'b1'])
		expect(ids(contents.coveredCards)).toEqual(['u1', 'a1', 'a2', 'b1'])
		expect(countItems(contents)).toBe('1 section, 4 cards')
		expect(nameItems(contents)).toBe('1 section and 4 cards')
	})

	it('names a single item without a count', () => {
		const one = selectionContents(
			grouped,
			new Set(),
			new Set(['u1' as Id<'cards'>]),
		)

		expect(countItems(one)).toBe('1 card')
		expect(nameItems(one)).toBe('card')
	})

	it('names a lone section without its cards, as its own menu does', () => {
		const lone = selectionContents(
			grouped,
			new Set(['A' as Id<'sections'>]),
			new Set(),
		)

		expect(countItems(lone)).toBe('1 section, 2 cards')
		expect(nameItems(lone)).toBe('section')
	})
})
