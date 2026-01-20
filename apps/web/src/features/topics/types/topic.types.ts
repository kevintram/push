import type { LearningState } from '~/models/learning-state.types'

export const RelationshipDirection = {
	Outgoing: 'outgoing',
	Incoming: 'incoming'
} as const

export type RelationshipDirection =
	(typeof RelationshipDirection)[keyof typeof RelationshipDirection]

export type RetrievabilityBucket = 'LATE' | 'ON_TIME' | 'EARLY'

export type Topic = {
	id: number
	name: string
	notes: string
	inserted_at: string
	updated_at: string
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
	srs_enabled: boolean
	retrievability: number | null
	bucket: RetrievabilityBucket | null
	days_until_threshold: number | null
	children_count?: number
	sources_count?: number
	related_outgoing_count?: number
	related_incoming_count?: number
	parent?: Topic | null
	children?: Array<Topic>
	related_outgoing?: Array<Topic>
	related_incoming?: Array<Topic>
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
