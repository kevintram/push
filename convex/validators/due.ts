import { type Infer, v } from 'convex/values'

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
})

export type DueDateRange = Infer<typeof dateRange>
export type DueFilters = Infer<typeof dueFilters>
