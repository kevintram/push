import * as v from 'valibot'

export const TopicSchema = v.object({
	id: v.number(),
	title: v.string(),
	body: v.string(),
	parent_id: v.nullable(v.number()),
	parent_title: v.nullable(v.string()),
	inserted_at: v.string(),
	updated_at: v.string()
})
