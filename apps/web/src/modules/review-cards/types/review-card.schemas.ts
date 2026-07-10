import * as v from 'valibot'

import { ReviewCardStatusBadgeSchema } from './status-badge.schemas'

export const ReviewCardTypeSchema = v.picklist(['practice', 'flashcard'])
export const ReviewRatingSchema = v.picklist(['miss', 'hard', 'good', 'easy'])

export const ReviewCardSchema = v.object({
	id: v.number(),
	topicId: v.number(),
	topicTitle: v.string(),
	type: ReviewCardTypeSchema,
	primaryText: v.string(),
	secondaryText: v.string(),
	notes: v.string(),
	insertedAt: v.string(),
	updatedAt: v.string(),
	lastReviewRating: v.nullable(ReviewRatingSchema),
	stability: v.nullable(v.number()),
	difficulty: v.nullable(v.number()),
	state: v.string(),
	step: v.nullable(v.number()),
	retired: v.boolean(),
	flaggedAt: v.nullable(v.string()),
	lastReviewedAt: v.nullable(v.string()),
	retrievability: v.nullable(v.number()),
	freshnessTier: v.nullable(v.string()),
	daysUntilNextTier: v.nullable(v.number()),
	daysInCurrentTier: v.nullable(v.number()),
	isNew: v.boolean(),
	reviewsPendingCount: v.optional(v.number(), 0),
	reviewsOverdueCount: v.optional(v.number(), 0),
	reviewsDueTodayCount: v.optional(v.number(), 0),
	statusBadges: v.array(ReviewCardStatusBadgeSchema),
})

export const ReviewCardQueueItemSchema = v.object({
	queueType: v.picklist(['due', 'hazy', 'new']),
	card: ReviewCardSchema,
	reviewId: v.nullable(v.number()),
	scheduledAt: v.nullable(v.string()),
	actionDays: v.nullable(v.number()),
	daysUntilDue: v.nullable(v.number()),
	daysUntilHazy: v.nullable(v.number()),
})

export const ReviewCardQueuePageSchema = v.object({
	items: v.array(ReviewCardQueueItemSchema),
	asOf: v.string(),
})

export const ReviewCardQueueSummarySchema = v.object({
	overdueCount: v.number(),
	dueTodayCount: v.number(),
	dueNextSevenDaysCount: v.number(),
	newCount: v.number(),
	asOf: v.string(),
})

export const ReviewCardFlaggedSummarySchema = v.object({
	flaggedCount: v.number(),
})
