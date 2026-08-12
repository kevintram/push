import { type Infer, v } from 'convex/values'

import { reviewCardRead } from './reviewCards'
import { reviewRead } from './reviews'

/** A half-open due-date range. Omitted bounds extend indefinitely. */
export const dueDateRange = v.object({
	from: v.optional(v.string()),
	to: v.optional(v.string()),
})

export const dueDate = v.union(v.string(), dueDateRange)

/** A single day's worth of scheduled work for one review card. */
export const dueEntry = v.object({
	date: v.string(),
	card: reviewCardRead,
	srsScheduled: v.boolean(),
	scheduledReviews: v.array(reviewRead),
})

export type DueDateRange = Infer<typeof dueDateRange>
export type DueEntry = Infer<typeof dueEntry>
