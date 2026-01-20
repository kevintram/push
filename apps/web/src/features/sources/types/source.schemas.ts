import * as v from 'valibot'
import { TopicSchema } from '~/features/topics/types/topic.schemas'
import type {
	Source,
	SourceRelationshipResponse,
	SourceTopicResponse
} from './source.types'

export const SourceSchema: v.GenericSchema<Source> = v.object({
	id: v.number(),
	title: v.string(),
	notes: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	parent_id: v.nullable(v.number()),
	fsrs_state_id: v.nullable(v.number()),
	archived: v.boolean(),
	inboxed: v.boolean(),
	// FSRS fields
	stability: v.nullable(v.number()),
	difficulty: v.nullable(v.number()),
	state: v.picklist(['LEARNING', 'REVIEW', 'RELEARNING']),
	step: v.nullable(v.number()),
	srs_enabled: v.boolean(),
	last_reviewed_at: v.nullable(v.string()),
	// Inherited FSRS fields
	inherited_stability: v.nullable(v.number()),
	inherited_difficulty: v.nullable(v.number()),
	inherited_state: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	inherited_step: v.nullable(v.number()),
	inherited_last_review: v.nullable(v.string()),
	// Computed fields
	retrievability: v.nullable(v.number()),
	bucket: v.nullable(v.picklist(['LATE', 'ON_TIME', 'EARLY'])),
	days_until_threshold: v.nullable(v.number()),
	// Relationship counts
	children_count: v.optional(v.number(), 0),
	topics_count: v.optional(v.number(), 0),
	// Relationships (loaded conditionally)
	parent: v.nullish(v.lazy(() => SourceSchema)),
	children: v.optional(v.array(v.lazy(() => SourceSchema)), []),
	topics: v.optional(v.array(TopicSchema), [])
})

export const SourceRelationshipResponseSchema: v.GenericSchema<SourceRelationshipResponse> =
	v.object({
		parent: v.lazy(() => SourceSchema),
		child: v.lazy(() => SourceSchema)
	})

export const SourceTopicResponseSchema: v.GenericSchema<SourceTopicResponse> =
	v.object({
		source: v.lazy(() => SourceSchema),
		topic: TopicSchema
	})
