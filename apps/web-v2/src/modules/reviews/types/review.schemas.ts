import * as v from 'valibot'

export const ReviewCardSchema = v.object({
	id: v.number(),
	primary_text: v.string(),
	secondary_text: v.optional(v.string()),
})
