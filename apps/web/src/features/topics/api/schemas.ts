import * as v from 'valibot'
import type { Topic } from '~/types/topics.types'

// Base topic schema matching the API response from /topics/ endpoint
const TopicsSchema = v.object({
	id: v.number(),
	name: v.string(),
	notes: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	stability: v.number(),
	retrievability: v.number(),
	archived: v.boolean(),
	inboxed: v.boolean()
})

export const TopicWithRelationshipsSchema = v.object({
	id: v.number(),
	name: v.string(),
	notes: v.string(),
	inserted_at: v.string(),
	updated_at: v.string(),
	stability: v.number(),
	retrievability: v.number(),
	archived: v.boolean(),
	inboxed: v.boolean(),
	parents: v.array(TopicsSchema),
	children: v.array(TopicsSchema)
})

type TopicWithRelationshipsRaw = v.InferOutput<
	typeof TopicWithRelationshipsSchema
>

export type TopicWithRelationships = TopicWithRelationshipsRaw &
	Topic & {
		parents: Array<Topic>
		children: Array<Topic>
	}

// Common type for TopicCard - works with both API and Supabase data
// The only difference is user_id (present in Supabase, absent in API)
export type TopicCardTopic = Topic & {
	parents?: Array<Omit<Topic, 'parents' | 'children'>>
	children?: Array<Omit<Topic, 'parents' | 'children'>>
}
