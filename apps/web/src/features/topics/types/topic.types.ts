import type { Practice } from '~/features/practices/types/practice.types'
import type { Source } from '~/features/sources/types/source.types'
import type { FreshnessTier, ReviewRating } from '~/models/learnable.types'
import type { LearningState } from '~/models/learning-state.types'

// A related entity can be either a full Topic or Source with entity_type discriminator
export type RelatedEntityItem =
	| (Topic & { entity_type: 'topic' })
	| (Source & { entity_type: 'source' })

export const RelationshipDirection = {
	Outgoing: 'outgoing',
	Incoming: 'incoming'
} as const

export type RelationshipDirection =
	(typeof RelationshipDirection)[keyof typeof RelationshipDirection]

export type Topic = {
	id: number
	name: string
	notes: string
	entity_type?: 'topic' // Discriminator for related entities
	inserted_at: string
	updated_at: string
	recent_activity_at?: string | null
	parent_id: number | null
	fsrs_state_id: number | null
	stability: number | null
	inherited_stability: number | null
	inherited_difficulty: number | null
	inherited_state: LearningState | null
	inherited_step: number | null
	inherited_last_review: string | null
	difficulty: number | null
	state: LearningState
	step: number | null
	archived: boolean
	inboxed: boolean
	last_reviewed_at: string | null
	last_review_rating: ReviewRating | null
	srs_enabled: boolean
	retrievability: number | null
	freshness_tier: FreshnessTier | null
	days_until_next_tier: number | null
	children_count?: number
	sources_count?: number
	practices_count?: number
	related_outgoing_count?: number
	related_incoming_count?: number
	parent?: Topic | null
	children?: Array<Topic>
	related_outgoing?: Array<RelatedEntityItem>
	related_incoming?: Array<RelatedEntityItem>
	sources?: Array<Source>
	practices?: Array<Practice>
	relationship_direction?: RelationshipDirection
}

export type TopicRelationshipResponse = {
	parent: Topic
	child: Topic
}

export type TopicOtherRelationshipCreate = {
	to_topic_id?: number
	to_topic?: {
		name: string
		notes: string
		archived: boolean
		inboxed: boolean
		parent_id?: number | null
		srs_enabled?: boolean
		inherit_fsrs?: boolean
	}
}

export type TopicOtherRelationshipResponse = {
	from_topic: Topic
	to_topic: Topic
}
