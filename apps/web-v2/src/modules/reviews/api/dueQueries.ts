import { api } from '@convex/_generated/api'
import type { DueDateRange } from '@convex/validators/due'
import { convexQuery } from '@convex-dev/react-query'

import type { DateString } from '~/types/date'

export const dueQueries = {
	list: (dueDate: DateString | DueDateRange) =>
		convexQuery(api.due.list, { dueDate }),
}
