import * as v from 'valibot'

export const TopicSchema = v.object({
	id: v.number(),
	title: v.string(),
	body: v.string(),
	parentId: v.nullable(v.number()),
	parentTitle: v.nullable(v.string()),
	insertedAt: v.string(),
	updatedAt: v.string(),
})
