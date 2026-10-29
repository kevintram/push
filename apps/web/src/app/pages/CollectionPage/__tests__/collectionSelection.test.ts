import type { Id } from '@convex/_generated/dataModel'
import { describe, expect, it } from 'vitest'

import type { SelectableItem } from '../collectionOrder'
import {
	extendSelection,
	pruneSelection,
	selectOnly,
	selectRange,
	toggleItem,
} from '../collectionSelection'

const card = (id: string): SelectableItem => ({
	kind: 'card',
	id: id as Id<'cards'>,
})
const section = (id: string): SelectableItem => ({
	kind: 'section',
	id: id as Id<'sections'>,
})
const ids = (items: ReadonlyArray<SelectableItem> | undefined) =>
	items?.map(item => item.id)

// u1 | A: a1 a2 | B: b1
const order = [
	card('u1'),
	section('A'),
	card('a1'),
	card('a2'),
	section('B'),
	card('b1'),
]

describe('collection selection', () => {
	it('selects the cards of a range and skips the sections in it', () => {
		const range = selectRange(selectOnly(card('a2')), order, card('u1'))

		expect(ids(range.items)).toEqual(['u1', 'a1', 'a2'])
		expect(range.cursor).toEqual(card('u1'))
		expect(ids(selectRange(range, order, section('B')).items)).toEqual([
			'B',
		])
	})

	it('extends from the cursor to the next card, past a section', () => {
		const extended = extendSelection(selectOnly(card('a2')), order, 1)

		expect(ids(extended.items)).toEqual(['a2', 'b1'])
		expect(extendSelection(extended, order, 1)).toBe(extended)
	})

	it('toggles cards in and out, but never mixes in a section', () => {
		const both = toggleItem(selectOnly(card('u1')), card('b1'))
		expect(ids(both?.items)).toEqual(['u1', 'b1'])
		expect(ids(toggleItem(both, card('u1'))?.items)).toEqual(['b1'])
		expect(toggleItem(selectOnly(card('u1')), card('u1'))).toBeNull()

		expect(ids(toggleItem(both, section('A'))?.items)).toEqual(['A'])
		expect(
			ids(toggleItem(selectOnly(section('A')), card('a1'))?.items),
		).toEqual(['a1'])
	})

	it('drops items that leave the page and keeps the anchor and cursor on it', () => {
		const range = selectRange(selectOnly(card('a1')), order, card('b1'))
		const pruned = pruneSelection(
			range,
			order.filter(item => item.id !== 'a1'),
		)

		expect(ids(pruned?.items)).toEqual(['a2', 'b1'])
		expect(pruned?.anchor).toEqual(card('a2'))
		expect(pruned?.cursor).toEqual(card('b1'))
		expect(pruneSelection(range, [])).toBeNull()
	})
})
