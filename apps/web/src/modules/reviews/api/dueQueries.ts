import { api } from '@convex/_generated/api'
import type { DueEntry, DueFilters } from '@convex/validators/due'
import { convexQuery } from '@convex-dev/react-query'

import type { DateString } from '~/types/date'

/**
 * `DueFilters` with the date fields narrowed to `DateString`.
 *
 * Convex validators cannot express a template-literal type, so the wire
 * validator accepts any `string`. Narrowing here keeps a malformed date a
 * compile error at the call site rather than a runtime `assertIsoDate` throw.
 */
export type ClientDueFilters = Omit<DueFilters, 'dueDate'> & {
	dueDate: DateString | { from?: DateString; to?: DateString } | null
}

const list = (filters: ClientDueFilters) => convexQuery(api.due.list, filters)

/**
 * A card late on several days has one entry per day; collapse them to one card
 * each. Module-level so `select` keeps a stable identity across renders.
 */
const uniqueCards = (entries: Array<DueEntry>) => [
	...new Map(entries.map(entry => [entry.card._id, entry.card])).values(),
]

export const dueQueries = {
	list,
	/** Scheduled for `today`. */
	listDue: (today: DateString) => list({ dueDate: today }),
	/** Everything still owed from before `today`. */
	listLate: (today: DateString) => list({ dueDate: { to: today } }),
	/** `listLate` collapsed to the unique cards; shares its cache entry. */
	listLateCards: (today: DateString) => ({
		...dueQueries.listLate(today),
		select: uniqueCards,
	}),
	/**
	 * Cards that have not entered SRS. `srsScheduled: true` keeps the queue
	 * card-driven, so a card does not appear solely because of an undated
	 * hand-scheduled review.
	 */
	listNew: () => list({ dueDate: null, srsScheduled: true }),
}
