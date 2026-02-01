import type { Practice } from '~/features/practices/types/practice.types'
import type {
	RelatedEntityItem,
	Topic
} from '~/features/topics/types/topic.types'
import type { LearningState } from '~/models/learning-state.types'

export type RetrievabilityBucket = 'LATE' | 'ON_TIME' | 'EARLY'

export type Source = {
	id: number
	title: string
	notes: string
	entity_type?: 'source' // Discriminator for related entities
	inserted_at: string
	updated_at: string
	parent_id: number | null
	fsrs_state_id: number | null
	archived: boolean
	inboxed: boolean
	// FSRS fields
	stability: number | null
	difficulty: number | null
	state: LearningState
	step: number | null
	srs_enabled: boolean
	last_reviewed_at: string | null
	// Inherited FSRS fields
	inherited_stability: number | null
	inherited_difficulty: number | null
	inherited_state: LearningState | null
	inherited_step: number | null
	inherited_last_review: string | null
	// Computed fields
	retrievability: number | null
	bucket: RetrievabilityBucket | null
	days_until_threshold: number | null
	// Relationship counts
	children_count?: number
	topics_count?: number
	related_outgoing_count?: number
	related_incoming_count?: number
	prerequisites_count?: number
	practices_count?: number
	// Relationships (loaded conditionally)
	parent?: Source | null
	children?: Array<Source>
	topics?: Array<Topic>
	practices?: Array<Practice>
	related_outgoing?: Array<RelatedEntityItem>
	related_incoming?: Array<RelatedEntityItem>
}

export type SourceRelationshipResponse = {
	parent: Source
	child: Source
}

export type SourceTopicResponse = {
	source: Source
	topic: Topic
}

export type SourceCreate = {
	title?: string
	notes?: string
	archived?: boolean
	inboxed?: boolean
	parent_id?: number | null
	srs_enabled?: boolean
	inherit_fsrs?: boolean
}

export type SourceUpdate = {
	title?: string
	notes?: string
	archived?: boolean
	inboxed?: boolean
	parent_id?: number | null
	srs_enabled?: boolean
}

export type SourceChildRelationshipCreate = {
	child_id?: number
	child?: SourceCreate
}

export type SourceTopicAdd = {
	topic_id?: number
	topic?: {
		name: string
		notes: string
		archived: boolean
		inboxed: boolean
		srs_enabled?: boolean
		inherit_fsrs?: boolean
	}
}
