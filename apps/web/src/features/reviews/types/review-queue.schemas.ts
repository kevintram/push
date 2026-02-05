import * as v from 'valibot'
import { PracticeSchemaBase } from '~/features/practices/types/practice.schemas'
import { SourceSchemaBase } from '~/features/sources/types/source.schemas'
import { TopicSchemaBase } from '~/features/topics/types/topic.schemas'
import type { ReviewQueueItem } from './review-queue.types'

export const ReviewQueueItemSchema: v.GenericSchema<ReviewQueueItem> = v.object(
	{
		entity_type: v.picklist(['topic', 'source', 'practice']),
		topic: v.optional(v.nullable(TopicSchemaBase)),
		source: v.optional(v.nullable(SourceSchemaBase)),
		practice: v.optional(v.nullable(PracticeSchemaBase))
	}
)
