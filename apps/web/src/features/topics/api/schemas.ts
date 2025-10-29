import * as v from 'valibot'

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

export type TopicWithRelationships = v.InferOutput<
	typeof TopicWithRelationshipsSchema
>

// Common type for TopicCard - works with both API and Supabase data
// The only difference is user_id (present in Supabase, absent in API)
export type TopicCardTopic = {
	id: number
	name: string
	notes: string
	inserted_at: string
	updated_at: string
	stability: number
	retrievability: number
	archived: boolean
	inboxed: boolean
	user_id?: string // Optional - only present from Supabase
	parents?: Array<Omit<TopicCardTopic, 'parents' | 'children'>>
	children?: Array<Omit<TopicCardTopic, 'parents' | 'children'>>
}
