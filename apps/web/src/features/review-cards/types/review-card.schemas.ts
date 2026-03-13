import * as v from 'valibot'
import { ReviewCardStatusBadgeSchema } from './status-badge.schemas'

export const ReviewCardTypeSchema = v.picklist(['practice', 'flashcard'])
export const ReviewRatingSchema = v.picklist(['miss', 'hard', 'good', 'easy'])

export const ReviewCardSchema = v.object({
	id: v.number(),
	topic_id: v.number(),
	topic_title: v.string(),
	type: ReviewCardTypeSchema,
	prompt: v.string(),
	answer: v.string(),
	notes: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	last_review_rating: v.nullable(ReviewRatingSchema),
	stability: v.nullable(v.number()),
	difficulty: v.nullable(v.number()),
	state: v.string(),
	step: v.nullable(v.number()),
	retired: v.boolean(),
	flagged_at: v.nullable(v.string()),
	last_reviewed_at: v.nullable(v.string()),
	retrievability: v.nullable(v.number()),
	freshness_tier: v.nullable(v.string()),
	days_until_next_tier: v.nullable(v.number()),
	days_in_current_tier: v.nullable(v.number()),
	is_new: v.boolean(),
	status_badges: v.array(ReviewCardStatusBadgeSchema)
})

export const ReviewCardQueueItemSchema = v.object({
	queue_type: v.picklist(['due', 'hazy', 'new']),
	card: ReviewCardSchema,
	review_id: v.nullable(v.number()),
	scheduled_at: v.nullable(v.string()),
	days_until_due: v.nullable(v.number()),
	days_until_hazy: v.nullable(v.number())
})

export const ReviewCardQueuePageSchema = v.object({
	items: v.array(ReviewCardQueueItemSchema),
	as_of: v.string()
})

export const ReviewCardQueueSummarySchema = v.object({
	overdue_count: v.number(),
	due_today_count: v.number(),
	due_next_seven_days_count: v.number(),
	new_count: v.number(),
	as_of: v.string()
})

export const ReviewCardFlaggedSummarySchema = v.object({
	flagged_count: v.number()
})
