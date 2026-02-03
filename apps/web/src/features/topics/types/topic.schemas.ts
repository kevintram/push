import * as v from 'valibot'
import { PracticeSchemaBase } from '~/features/practices/types/practice.schemas'
import { SourceSchemaBase } from '~/features/sources/types/source.schemas'
import type {
	Topic,
	TopicOtherRelationshipResponse,
	TopicRelationshipResponse
} from './topic.types'
import { RelationshipDirection } from './topic.types'

// Related entities are full Topic or Source objects with entity_type discriminator.
// We use v.any() here because the backend returns full objects, and trying to
// define a schema that matches RelatedEntityItem exactly is complex due to
// circular dependencies between Topic and Source schemas.
// The runtime data is validated by the backend; this just allows passthrough.

// Base fields shared by all topic schemas
const topicBaseFields = {
	id: v.number(),
	name: v.string(),
	notes: v.string(),
	entity_type: v.optional(v.literal('topic')),
	inserted_at: v.string(),
	updated_at: v.string(),
	recent_activity_at: v.optional(v.nullable(v.string())),
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
	relationship_direction: v.optional(v.enum_(RelationshipDirection))
} as const

/**
 * Base topic schema without sources relationship.
 * Used by SourceSchema to avoid circular dependency.
 */
export const TopicSchemaBase: v.GenericSchema<Omit<Topic, 'sources'>> =
	v.object({
		...topicBaseFields,
		// Relationships (loaded conditionally) - no sources here to avoid circular dep
		parent: v.nullish(
			v.lazy((): v.GenericSchema<Omit<Topic, 'sources'>> => TopicSchemaBase)
		),
		children: v.optional(
			v.array(
				v.lazy((): v.GenericSchema<Omit<Topic, 'sources'>> => TopicSchemaBase)
			),
			[]
		),
		related_outgoing: v.optional(v.array(v.any()), []),
		related_incoming: v.optional(v.array(v.any()), [])
	})

export const TopicSchema: v.GenericSchema<Topic> = v.object({
	...topicBaseFields,
	// Relationships (loaded conditionally)
	parent: v.nullish(v.lazy((): v.GenericSchema<Topic> => TopicSchema)),
	children: v.optional(
		v.array(v.lazy((): v.GenericSchema<Topic> => TopicSchema)),
		[]
	),
	related_outgoing: v.optional(v.array(v.any()), []),
	related_incoming: v.optional(v.array(v.any()), []),
	sources: v.optional(v.array(v.lazy(() => SourceSchemaBase)), []),
	practices: v.optional(v.array(v.lazy(() => PracticeSchemaBase)), [])
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
