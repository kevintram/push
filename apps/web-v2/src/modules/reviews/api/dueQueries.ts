import { api } from '@convex/_generated/api'
import type { DueDateRange } from '@convex/validators/due'
import { convexQuery } from '@convex-dev/react-query'

import type { DateString } from '~/types/date'

export const dueQueries = {
	listByDueDate: (dueDate: DateString | DueDateRange) =>
		convexQuery(api.due.listByDueDate, { dueDate }),
}
