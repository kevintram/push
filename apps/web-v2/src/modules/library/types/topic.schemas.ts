import * as v from 'valibot'

import { IdSchema } from '~/types/id.schema'

export const TopicSchema = v.pipe(
	v.object({
		id: IdSchema,
		parent_id: v.nullable(IdSchema),
		title: v.string(),
		body: v.string(),
	}),
	v.transform(({ parent_id, ...topic }) => ({
		...topic,
		parentId: parent_id ?? undefined,
	})),
)
