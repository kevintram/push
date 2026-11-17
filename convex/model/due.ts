import { assertIsoDate } from '../../shared/date'
import { type QueryCtx } from '../_generated/server'
import { type Card } from '../validators/cards'
import { type DueFilters } from '../validators/due'

export type { DueDateRange, DueFilters } from '../validators/due'

/**
 * Lists the active cards whose SRS `dueDate` matches `filters.dueDate`.
 * Retired cards are excluded.
 *
 * @param filters.dueDate a single day (isoDate), a half-open range `[from, to)`
 *   (either bound may be omitted; an empty object covers all dates), or `null`
 *   for cards that have not entered SRS.
 * @returns the cards, newest due date first, then newest card first
 */
export async function list(
	ctx: QueryCtx,
	userId: string,
	filters: DueFilters,
): Promise<Array<Card>> {
	const { dueDate } = filters

	// validate `dueDate` param
	if (dueDate === null) {
		// the dateless bucket; nothing to validate
	} else if (typeof dueDate === 'string') {
		// must be single
		assertIsoDate(dueDate)
	} else {
		// must be range
		if (dueDate.from !== undefined) assertIsoDate(dueDate.from)
		if (dueDate.to !== undefined) assertIsoDate(dueDate.to)

		if (
			dueDate.from !== undefined &&
			dueDate.to !== undefined &&
			dueDate.from > dueDate.to
		) {
			throw new Error(
				`Invalid date range: ${dueDate.from} is after ${dueDate.to}`,
			)
		}
	}

	// TODO(2): stop using unbounded `collect()`?
	return await ctx.db
		.query('cards')
		.withIndex('by_ownerId_retiredAt_dueDate', q => {
			// A retired card is out of the queue entirely, and the index
			// excludes it without a post-filter.
			const owned = q.eq('ownerId', userId).eq('retiredAt', undefined)

			if (dueDate === null) {
				return owned.eq('dueDate', undefined)
			}

			if (typeof dueDate === 'string') {
				return owned.eq('dueDate', dueDate)
			}

			if (dueDate.from !== undefined) {
				const lowerBounded = owned.gte('dueDate', dueDate.from)
				return dueDate.to === undefined
					? lowerBounded
					: lowerBounded.lt('dueDate', dueDate.to)
			}

			const dated = owned.gt('dueDate', undefined)
			return dueDate.to === undefined
				? dated
				: dated.lt('dueDate', dueDate.to)
		})
		// The index ends in `dueDate` then `_creationTime`, so descending
		// order is newest due date first, then newest card first.
		.order('desc')
		.collect()
}
