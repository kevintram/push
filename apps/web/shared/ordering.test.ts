import { describe, expect, it } from 'vitest'

import {
	compareRanked,
	placeInLine,
	placeNewInLine,
	type Ranked,
} from './ordering'

const row = (_id: string, _creationTime: number, rank?: string): Ranked => ({
	_id,
	_creationTime,
	...(rank !== undefined && { rank }),
})

const ids = (rows: Array<Ranked>) => rows.map(r => r._id)

describe('compareRanked', () => {
	it('sorts unranked rows first, then by rank, then by creation time', () => {
		const rows = [
			row('ranked-b', 1, 'a1'),
			row('tie-late', 5, 'a0'),
			row('unranked-late', 4),
			row('tie-early', 2, 'a0'),
			row('unranked-early', 3),
		]

		expect(ids(rows.sort(compareRanked))).toEqual([
			'unranked-early',
			'unranked-late',
			'tie-early',
			'tie-late',
			'ranked-b',
		])
	})

	it('compares keys by code unit, so uppercase sorts before lowercase', () => {
		expect(
			compareRanked(row('upper', 2, 'Zz'), row('lower', 1, 'a0')),
		).toBe(-1)
	})
})

describe('placeInLine', () => {
	const line = [row('a', 1, 'a0'), row('b', 2, 'a1'), row('c', 3, 'a2')]
	const order = (movingId: string, rank: string) =>
		ids(
			line
				.map(r => (r._id === movingId ? { ...r, rank } : r))
				.sort(compareRanked),
		)

	it('places a row after its anchor, ignoring its own old slot', () => {
		const { rank, backfill } = placeInLine(line, 'a', 'b')

		expect(backfill).toEqual([])
		expect(order('a', rank)).toEqual(['b', 'a', 'c'])
	})

	it('places a row first when there is no anchor', () => {
		expect(order('c', placeInLine(line, 'c', null).rank)).toEqual([
			'c',
			'a',
			'b',
		])
	})

	it('backfills the other unranked rows so the new key fits between them', () => {
		const unranked = [row('a', 1), row('b', 2), row('c', 3)]
		const { rank, backfill } = placeInLine(unranked, 'c', 'a')
		const assigned = new Map(backfill.map(({ _id, rank }) => [_id, rank]))

		expect([...assigned.keys()]).toEqual(['a', 'b'])
		expect(assigned.get('a')! < rank && rank < assigned.get('b')!).toBe(
			true,
		)
	})

	it('rejects an anchor that is not in the list, including the row itself', () => {
		expect(() => placeInLine(line, 'a', 'missing')).toThrow(
			'The item to place after is not in this list',
		)
		expect(() => placeInLine(line, 'a', 'a')).toThrow(
			'The item to place after is not in this list',
		)
	})
})

describe('placeNewInLine', () => {
	const line = [row('a', 1, 'a0'), row('b', 2, 'a1')]
	const order = (rank: string) =>
		ids([...line, row('new', 3, rank)].sort(compareRanked))

	it('places a new row after its anchor', () => {
		const { rank, backfill } = placeNewInLine(line, 'a')

		expect(backfill).toEqual([])
		expect(order(rank)).toEqual(['a', 'new', 'b'])
	})

	it('places a new row first when there is no anchor', () => {
		expect(order(placeNewInLine(line, null).rank)).toEqual([
			'new',
			'a',
			'b',
		])
	})

	it('rejects an anchor that is not in the list', () => {
		expect(() => placeNewInLine(line, 'missing')).toThrow(
			'The item to place after is not in this list',
		)
	})
})
