import type { LearningState } from '~/models/learning-state.types'

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
	due: string | null
	scheduled_at: string | null
	srs_enabled: boolean
	parents?: Array<Topic>
	children?: Array<Topic>
	related?: Array<Topic>
}

export type TopicRelationshipResponse = {
	parent: Topic
	child: Topic
}

export type TopicOtherRelationshipCreate = {
	to_topic_id: number
}

export type TopicOtherRelationshipResponse = {
	from_topic: Topic
	to_topic: Topic
}
