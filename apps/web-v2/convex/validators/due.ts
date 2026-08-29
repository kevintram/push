import { type Infer, v } from 'convex/values'

import { cardRead } from './cards'
import { reviewRead } from './reviews'

/** A half-open date range. Omitted bounds extend indefinitely. */
export const dateRange = v.object({
	from: v.optional(v.string()),
	to: v.optional(v.string()),
})

/** A single day's worth of scheduled work for one card. */
export const dueEntry = v.object({
	date: v.string(),
	card: cardRead,
	srsScheduled: v.boolean(),
	scheduledReviews: v.array(reviewRead),
})

export type DueDateRange = Infer<typeof dateRange>
export type DueEntry = Infer<typeof dueEntry>
