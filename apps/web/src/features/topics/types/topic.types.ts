import type { LearningState } from '~/models/learning-state.types'

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
	inserted_at: string
	updated_at: string
	stability: number | null
	difficulty: number | null
	state: LearningState
	step: number | null
	archived: boolean
	inboxed: boolean
	last_reviewed_at: string | null
	scheduled_at: string | null
	srs_enabled: boolean
	retrievability: number | null
	parents?: Array<Topic>
	children?: Array<Topic>
	related?: Array<Topic>
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
	}
}

export type TopicOtherRelationshipResponse = {
	from_topic: Topic
	to_topic: Topic
}
