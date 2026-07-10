import * as v from 'valibot'

export const TopicSchema = v.pipe(
	v.object({
		id: v.number(),
		parent_id: v.nullable(v.number()),
		title: v.string(),
		body: v.string(),
	}),
	v.transform(({ parent_id, ...topic }) => ({
		...topic,
		parentId: parent_id ?? undefined,
	})),
)
