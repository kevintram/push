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
	srs_enabled: boolean
	parents?: Array<Topic>
	children?: Array<Topic>
}

export type TopicRelationshipResponse = {
	parent: Topic
	child: Topic
}
