import * as v from 'valibot'

import { DateStringSchema } from '~/types/date.schema'
import { IdSchema } from '~/types/id.schema'

export const ReviewCardSchema = v.object({
	id: IdSchema,
	topic_id: IdSchema,
	type: v.picklist(['practice', 'flashcard']),
	primary_text: v.string(),
	secondary_text: v.string(),
	notes: v.string(),
	stability: v.nullable(v.number()),
	last_reviewed_at: v.nullable(DateStringSchema),
	next_due_at: v.nullable(DateStringSchema),
	freshness_tier: v.nullable(v.string()),
	flagged_at: v.nullable(v.string()),
})

export const ReviewSchema = v.object({
	id: IdSchema,
	review_card_id: IdSchema,
	rating: v.nullable(v.picklist(['miss', 'hard', 'good', 'easy'])),
	description: v.string(),
	notes: v.string(),
	scheduled_at: v.nullable(v.string()),
	completed_at: v.nullable(v.string()),
	effective_date: v.nullable(v.string()),
	inserted_at: v.string(),
	updated_at: v.string(),
	review_card: v.object({
		id: IdSchema,
		topic_id: IdSchema,
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
