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
	const line = [
		row('a', 1, 'a0'),
		row('b', 2, 'a1'),
		row('c', 3, 'a2'),
		row('d', 4, 'a3'),
	]
	const order = ({
		ranks,
	}: {
		ranks: Array<{ _id: string; rank: string }>
	}) => {
		const placed = new Map(ranks.map(({ _id, rank }) => [_id, rank]))
		return ids(
			line
				.map(r => ({ ...r, rank: placed.get(r._id) ?? r.rank }))
				.sort(compareRanked),
		)
	}

	it('places a row after its anchor, ignoring its own old slot', () => {
		const placement = placeInLine(line, ['a'], 'b')

		expect(placement.backfill).toEqual([])
		expect(order(placement)).toEqual(['b', 'a', 'c', 'd'])
	})

	it('places a row first when there is no anchor', () => {
		expect(order(placeInLine(line, ['c'], null))).toEqual([
			'c',
			'a',
			'b',
			'd',
		])
	})

	it('gathers several rows into one run, in the given order', () => {
		expect(order(placeInLine(line, ['d', 'a'], 'b'))).toEqual([
			'b',
			'd',
			'a',
			'c',
		])
		expect(placeInLine(line, ['a', 'a'], 'b').ranks).toHaveLength(1)
	})

	it('backfills the other unranked rows so the new key fits between them', () => {
		const unranked = [row('a', 1), row('b', 2), row('c', 3)]
		const { ranks, backfill } = placeInLine(unranked, ['c'], 'a')
		const assigned = new Map(backfill.map(({ _id, rank }) => [_id, rank]))
		const rank = ranks[0]!.rank

		expect([...assigned.keys()]).toEqual(['a', 'b'])
		expect(assigned.get('a')! < rank && rank < assigned.get('b')!).toBe(
			true,
		)
	})

	it('rejects an anchor that is not in the list, including a moving row', () => {
		expect(() => placeInLine(line, ['a'], 'missing')).toThrow(
			'The item to place after is not in this list',
		)
		expect(() => placeInLine(line, ['a', 'b'], 'b')).toThrow(
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

	it('backfills unranked rows so the new key fits between them', () => {
		const unranked = [row('a', 1), row('b', 2)]
		const { rank, backfill } = placeNewInLine(unranked, 'a')
		const assigned = new Map(backfill.map(({ _id, rank }) => [_id, rank]))

		expect([...assigned.keys()]).toEqual(['a', 'b'])
		expect(assigned.get('a')! < rank && rank < assigned.get('b')!).toBe(
			true,
		)
	})

	it('rejects an anchor that is not in the list', () => {
		expect(() => placeNewInLine(line, 'missing')).toThrow(
			'The item to place after is not in this list',
		)
	})
})
