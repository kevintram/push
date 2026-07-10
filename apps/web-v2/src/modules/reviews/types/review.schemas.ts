import * as v from 'valibot'

export const ReviewCardSchema = v.object({
	id: v.number(),
	primaryText: v.string(),
	secondaryText: v.optional(v.string()),
})
