import * as v from 'valibot'

export const ReviewCardSchema = v.object({
	id: v.number(),
	topic_id: v.number(),
	primary_text: v.string(),
	secondary_text: v.string(),
	notes: v.string(),
})

export const ReviewSchema = v.object({
	id: v.number(),
	review_card_id: v.number(),
	rating: v.nullable(v.picklist(['miss', 'hard', 'good', 'easy'])),
	description: v.string(),
	notes: v.string(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),
	inserted_at: v.string(),
	updated_at: v.string(),
	review_card: v.object({
		id: v.number(),
		topic_id: v.number(),
		type: v.picklist(['practice', 'flashcard']),
		primary_text: v.string(),
		secondary_text: v.string(),
	}),
	stability_before: v.nullable(v.number()),
	difficulty_before: v.nullable(v.number()),
	state_before: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	step_before: v.nullable(v.number()),
	due_before: v.nullable(v.string()),
	stability_after: v.nullable(v.number()),
	difficulty_after: v.nullable(v.number()),
	state_after: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	step_after: v.nullable(v.number()),
	due_after: v.nullable(v.string()),
})
