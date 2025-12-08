import * as v from 'valibot'
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

export const TopicSchema: v.GenericSchema<Topic> = v.object({
	id: v.number(),
	name: v.string(),
	notes: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	stability: v.nullable(v.number()),
	difficulty: v.nullable(v.number()),
	state: v.picklist(['LEARNING', 'REVIEW', 'RELEARNING']),
	step: v.nullable(v.number()),
	archived: v.boolean(),
	inboxed: v.boolean(),
	due: v.nullable(v.string()),
	srs_enabled: v.boolean(),
	parents: v.optional(v.array(v.lazy(() => TopicSchema)), []),
	children: v.optional(v.array(v.lazy(() => TopicSchema)), [])
})

export const TopicRelationshipResponseSchema: v.GenericSchema<TopicRelationshipResponse> =
	v.object({
		parent: v.lazy(() => TopicSchema),
		child: v.lazy(() => TopicSchema)
	})
