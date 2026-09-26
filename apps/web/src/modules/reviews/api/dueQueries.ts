import { api } from '@convex/_generated/api'
import type { DueFilters } from '@convex/validators/due'
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

export const dueQueries = {
	list,
	/** Scheduled for `today`. */
	listDue: (today: DateString) => list({ dueDate: today }),
	/** Everything still owed from before `today`. */
	listLate: (today: DateString) => list({ dueDate: { to: today } }),
	/**
	 * Cards that have not entered SRS. `srsScheduled: true` keeps the queue
	 * card-driven, so a card does not appear solely because of an undated
	 * hand-scheduled review.
	 */
	listNew: () => list({ dueDate: null, srsScheduled: true }),
}
