import { type Infer, v } from 'convex/values'

import { cardRead } from './cards'
import { reviewRead } from './reviews'

/** A half-open date range. Omitted bounds extend indefinitely. */
export const dateRange = v.object({
	from: v.optional(v.string()),
	to: v.optional(v.string()),
})

/**
 * The filters accepted by `due.list`. Single source of truth for the query
 * args, the model signature, and the frontend call site.
 */
export const dueFilters = v.object({
	dueDate: v.union(v.string(), dateRange, v.null()),
	srsScheduled: v.optional(v.boolean()),
})

/**
 * One queue row, keyed by `(date, card)`.
 *
 * `date` is absent for the `dueDate: null` bucket, where neither the card nor
 * its reviews carry a day.
 */
export const dueEntry = v.object({
	date: v.optional(v.string()),
	card: cardRead,
	srsScheduled: v.boolean(),
	scheduledReviews: v.array(reviewRead),
})

export type DueDateRange = Infer<typeof dateRange>
export type DueFilters = Infer<typeof dueFilters>
export type DueEntry = Infer<typeof dueEntry>
