import * as v from 'valibot'
import type {
	Topic,
	TopicOtherRelationshipResponse,
	TopicRelationshipResponse
} from './topic.types'
import { RelationshipDirection } from './topic.types'

export const TopicSchema: v.GenericSchema<Topic> = v.object({
	id: v.number(),
	name: v.string(),
	notes: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	parent_id: v.nullable(v.number()),
	fsrs_state_id: v.nullable(v.number()),
	stability: v.nullable(v.number()),
	inherited_stability: v.nullable(v.number()),
	inherited_difficulty: v.nullable(v.number()),
	inherited_state: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	inherited_step: v.nullable(v.number()),
	inherited_last_review: v.nullable(v.string()),
	difficulty: v.nullable(v.number()),
	state: v.picklist(['LEARNING', 'REVIEW', 'RELEARNING']),
	step: v.nullable(v.number()),
	archived: v.boolean(),
	inboxed: v.boolean(),
	last_reviewed_at: v.nullable(v.string()),
	srs_enabled: v.boolean(),
	retrievability: v.nullable(v.number()),
	bucket: v.nullable(v.picklist(['LATE', 'ON_TIME', 'EARLY'])),
	days_until_threshold: v.nullable(v.number()),
	children_count: v.optional(v.number(), 0),
	sources_count: v.optional(v.number(), 0),
	related_outgoing_count: v.optional(v.number(), 0),
	related_incoming_count: v.optional(v.number(), 0),
	parent: v.nullish(v.lazy(() => TopicSchema)),
	children: v.optional(v.array(v.lazy(() => TopicSchema)), []),
	related_outgoing: v.optional(v.array(v.lazy(() => TopicSchema)), []),
	related_incoming: v.optional(v.array(v.lazy(() => TopicSchema)), []),
	relationship_direction: v.optional(v.enum_(RelationshipDirection))
})

export const TopicRelationshipResponseSchema: v.GenericSchema<TopicRelationshipResponse> =
	v.object({
		parent: v.lazy(() => TopicSchema),
		child: v.lazy(() => TopicSchema)
	})

export const TopicOtherRelationshipResponseSchema: v.GenericSchema<TopicOtherRelationshipResponse> =
	v.object({
		from_topic: v.lazy(() => TopicSchema),
		to_topic: v.lazy(() => TopicSchema)
	})
