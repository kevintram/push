import * as v from 'valibot'
import { PracticeSchemaBase } from '~/features/practices/types/practice.schemas'
import { TopicSchemaBase } from '~/features/topics/types/topic.schemas'
import type {
	Source,
	SourceRelationshipResponse,
	SourceTopicResponse
} from './source.types'

// Related entities are full Topic or Source objects with entity_type discriminator.
// We use v.any() here because the backend returns full objects, and trying to
// define a schema that matches RelatedEntityItem exactly is complex due to
// circular dependencies between Topic and Source schemas.
// The runtime data is validated by the backend; this just allows passthrough.

// Base fields shared by all source schemas
const sourceBaseFields = {
	id: v.number(),
	title: v.string(),
	notes: v.string(),
	status: v.picklist(['NEW', 'IN_PROGRESS', 'ON_HOLD', 'DROPPED', 'COMPLETED']),
	progress_note: v.string(),
	entity_type: v.optional(v.literal('source')),
	inserted_at: v.string(),
	updated_at: v.string(),
	recent_activity_at: v.optional(v.nullable(v.string())),
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
	last_review_rating: v.nullable(v.picklist(['miss', 'hard', 'good', 'easy'])),
	// Inherited FSRS fields
	inherited_stability: v.nullable(v.number()),
	inherited_difficulty: v.nullable(v.number()),
	inherited_state: v.nullable(v.picklist(['LEARNING', 'REVIEW', 'RELEARNING'])),
	inherited_step: v.nullable(v.number()),
	inherited_last_review: v.nullable(v.string()),
	// Computed fields
	retrievability: v.nullable(v.number()),
	freshness_tier: v.nullable(
		v.picklist(['Fresh', 'Fine', 'Hazy', 'Forgotten'])
	),
	days_until_next_tier: v.nullable(v.number()),
	days_in_current_tier: v.nullable(v.number()),
	// Relationship counts
	children_count: v.optional(v.number(), 0),
	topics_count: v.optional(v.number(), 0),
	related_outgoing_count: v.optional(v.number(), 0),
	related_incoming_count: v.optional(v.number(), 0),
	prerequisites_count: v.optional(v.number(), 0),
	practices_count: v.optional(v.number(), 0)
} as const

/**
 * Base source schema without topics relationship.
 * Used by TopicSchema to avoid circular dependency.
 */
export const SourceSchemaBase: v.GenericSchema<Omit<Source, 'topics'>> =
	v.object({
		...sourceBaseFields,
		// Relationships (loaded conditionally) - no topics here to avoid circular dep
		parent: v.nullish(
			v.lazy((): v.GenericSchema<Omit<Source, 'topics'>> => SourceSchemaBase)
		),
		children: v.optional(
			v.array(
				v.lazy((): v.GenericSchema<Omit<Source, 'topics'>> => SourceSchemaBase)
			),
			[]
		)
	})

export const SourceSchema: v.GenericSchema<Source> = v.object({
	...sourceBaseFields,
	// Relationships (loaded conditionally)
	parent: v.nullish(v.lazy((): v.GenericSchema<Source> => SourceSchema)),
	children: v.optional(
		v.array(v.lazy((): v.GenericSchema<Source> => SourceSchema)),
		[]
	),
	topics: v.optional(v.array(v.lazy(() => TopicSchemaBase)), []),
	practices: v.optional(v.array(v.lazy(() => PracticeSchemaBase)), []),
	related_outgoing: v.optional(v.array(v.any()), []),
	related_incoming: v.optional(v.array(v.any()), [])
})

export const SourceRelationshipResponseSchema: v.GenericSchema<SourceRelationshipResponse> =
	v.object({
		parent: v.lazy((): v.GenericSchema<Source> => SourceSchema),
		child: v.lazy((): v.GenericSchema<Source> => SourceSchema)
	})

export const SourceTopicResponseSchema: v.GenericSchema<SourceTopicResponse> =
	v.object({
		source: v.lazy((): v.GenericSchema<Source> => SourceSchema),
		topic: v.lazy(() => TopicSchemaBase)
	})
