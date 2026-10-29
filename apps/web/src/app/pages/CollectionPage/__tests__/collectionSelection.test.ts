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
	it('selects every item of a range, sections included', () => {
		const range = selectRange(selectOnly(card('a2')), order, card('u1'))

		expect(ids(range.items)).toEqual(['u1', 'A', 'a1', 'a2'])
		expect(range.cursor).toEqual(card('u1'))
		expect(ids(selectRange(range, order, section('B')).items)).toEqual([
			'a2',
			'B',
		])
	})

	it('extends from the cursor onto the next item, a section included', () => {
		const extended = extendSelection(selectOnly(card('a2')), order, 1)
		expect(ids(extended.items)).toEqual(['a2', 'B'])

		const end = extendSelection(extended, order, 1)
		expect(ids(end.items)).toEqual(['a2', 'B', 'b1'])
		expect(extendSelection(end, order, 1)).toBe(end)
	})

	it('toggles sections and cards in and out together', () => {
		const both = toggleItem(selectOnly(card('u1')), section('B'))
		expect(ids(both?.items)).toEqual(['u1', 'B'])
		expect(ids(toggleItem(both, card('a1'))?.items)).toEqual([
			'u1',
			'B',
			'a1',
		])
		expect(ids(toggleItem(both, card('u1'))?.items)).toEqual(['B'])
		expect(toggleItem(selectOnly(section('A')), section('A'))).toBeNull()
	})

	it('drops items that leave the page and keeps the anchor and cursor on it', () => {
		const range = selectRange(selectOnly(card('a1')), order, card('b1'))
		const pruned = pruneSelection(
			range,
			order.filter(item => item.id !== 'a1'),
		)

		expect(ids(pruned?.items)).toEqual(['a2', 'B', 'b1'])
		expect(pruned?.anchor).toEqual(card('a2'))
		expect(pruned?.cursor).toEqual(card('b1'))
		expect(pruneSelection(range, [])).toBeNull()
	})
})
