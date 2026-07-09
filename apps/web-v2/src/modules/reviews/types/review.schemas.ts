import * as v from 'valibot'

export const ReviewCardStatusSchema = v.picklist(['due', 'new', 'late'])

export const ReviewCardSchema = v.object({
	id: v.number(),
	primary_text: v.string(),
	secondary_text: v.string(),
})
