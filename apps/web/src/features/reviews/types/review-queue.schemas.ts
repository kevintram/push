import * as v from 'valibot'
import {
	NoteSchema,
	NoteStatusBadgeSchema
} from '~/features/notes/types/note.schemas'
import type { ReviewQueueItem, ReviewQueuePage } from './review-queue.types'

export const ReviewQueueItemSchema: v.GenericSchema<ReviewQueueItem> = v.object(
	{
		queue_type: v.picklist(['due', 'hazy']),
		entity_type: v.literal('note'),
		note: NoteSchema,
		review_id: v.optional(v.nullable(v.number())),
		scheduled_at: v.optional(v.nullable(v.string())),
		days_until_due: v.optional(v.nullable(v.number())),
		days_until_hazy: v.optional(v.nullable(v.number())),
		status_badges: v.optional(v.array(NoteStatusBadgeSchema))
	}
)

export const ReviewQueuePageSchema: v.GenericSchema<ReviewQueuePage> = v.object(
	{
		items: v.array(ReviewQueueItemSchema),
		as_of: v.string()
	}
)
