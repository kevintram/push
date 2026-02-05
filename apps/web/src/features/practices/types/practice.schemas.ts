import * as v from 'valibot'
import { SourceSchemaBase } from '~/features/sources/types/source.schemas'
import { TopicSchemaBase } from '~/features/topics/types/topic.schemas'
import type {
	Practice,
	PracticeSourceResponse,
	PracticeTopicResponse
} from './practice.types'

// Base fields shared by all practice schemas
const practiceBaseFields = {
	id: v.number(),
	prompt: v.string(),
	answer: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	recent_activity_at: v.optional(v.nullable(v.string())),
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
	// Inherited FSRS fields (not used for practices, but kept for consistency)
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
	// Relationship counts
	topics_count: v.optional(v.number(), 0),
	sources_count: v.optional(v.number(), 0)
} as const

/**
 * Base practice schema without relationships.
 * Used for simple validations where relationships aren't loaded.
 */
export const PracticeSchemaBase: v.GenericSchema<
	Omit<Practice, 'topics' | 'sources'>
> = v.object({
	...practiceBaseFields
})

/**
 * Full practice schema with topics and sources relationships.
 */
export const PracticeSchema: v.GenericSchema<Practice> = v.object({
	...practiceBaseFields,
	// Relationships (loaded conditionally)
	topics: v.optional(v.array(v.lazy(() => TopicSchemaBase)), []),
	sources: v.optional(v.array(v.lazy(() => SourceSchemaBase)), [])
})

export const PracticeTopicResponseSchema: v.GenericSchema<PracticeTopicResponse> =
	v.object({
		practice: v.lazy((): v.GenericSchema<Practice> => PracticeSchema),
		topic: v.lazy(() => TopicSchemaBase)
	})

export const PracticeSourceResponseSchema: v.GenericSchema<PracticeSourceResponse> =
	v.object({
		practice: v.lazy((): v.GenericSchema<Practice> => PracticeSchema),
		source: v.lazy(() => SourceSchemaBase)
	})
