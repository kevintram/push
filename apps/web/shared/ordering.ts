import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

/**
 * A row ordered within its list by a fractional `rank` key. Rows created before
 * ranks existed have none until they are backfilled.
 */
export type Ranked<Id extends string = string> = {
	_id: Id
	_creationTime: number
	rank?: string
}

type RankAssignment<Id extends string = string> = {
	_id: Id
	rank: string
}

/**
 * Display order, matching a Convex index on `rank`: unranked rows first, then
 * by rank, then by creation time. Keys are compared by code unit, never with
 * `localeCompare`, which would disagree with the index.
 */
export function compareRanked(a: Ranked, b: Ranked): number {
	if (a.rank !== b.rank) {
		if (a.rank === undefined) return -1
		if (b.rank === undefined) return 1
		return a.rank < b.rank ? -1 : 1
	}

	return a._creationTime - b._creationTime
}

/** The key for a row appended after `lastRank`, the list's current last key. */
export function rankAfter(lastRank: string | undefined | null): string {
	return generateKeyBetween(lastRank ?? null, null)
}

/**
 * Keys for a list's unranked rows. They take the slots before its first ranked
 * row in their current order, so assigning them leaves the list's order as is.
 */
export function backfillRanks<Id extends string>(
	line: ReadonlyArray<Ranked<Id>>,
): Array<RankAssignment<Id>> {
	const sorted = [...line].sort(compareRanked)
	const unranked = sorted.filter(row => row.rank === undefined)
	const firstRank = sorted.find(row => row.rank !== undefined)?.rank ?? null
	const ranks = generateNKeysBetween(null, firstRank, unranked.length)

	return unranked.map((row, index) => ({ _id: row._id, rank: ranks[index]! }))
}

/**
 * Places `movingId` in `line` right after `afterId`, or first when `afterId` is
 * null. `line` is the destination list and may or may not contain the moving
 * row. Returns the moving row's new key, plus keys for any of the list's other
 * rows that were still unranked, since a key can only be placed between ranked
 * neighbors.
 */
export function placeInLine<Id extends string>(
	line: ReadonlyArray<Ranked<Id>>,
	movingId: Id,
	afterId: Id | null,
): { rank: string; backfill: Array<RankAssignment<Id>> } {
	return placeNewInLine(
		line.filter(row => row._id !== movingId),
		afterId,
	)
}

/**
 * Places a row that is not yet in `line` right after `afterId`, or first when
 * `afterId` is null. Returns the new row's key, plus keys for any of the
 * list's rows that were still unranked.
 */
export function placeNewInLine<Id extends string>(
	line: ReadonlyArray<Ranked<Id>>,
	afterId: Id | null,
): { rank: string; backfill: Array<RankAssignment<Id>> } {
	const backfill = backfillRanks(line)
	const backfilled = new Map(backfill.map(row => [row._id, row.rank]))
	const ranked = line
		.map(row => ({ ...row, rank: row.rank ?? backfilled.get(row._id) }))
		.sort(compareRanked)

	const anchorIndex =
		afterId === null ? -1 : ranked.findIndex(row => row._id === afterId)
	if (afterId !== null && anchorIndex === -1) {
		throw new Error('The item to place after is not in this list')
	}

	const before = anchorIndex === -1 ? null : ranked[anchorIndex]!.rank
	const after = ranked[anchorIndex + 1]?.rank ?? null

	return { rank: generateKeyBetween(before, after), backfill }
}
