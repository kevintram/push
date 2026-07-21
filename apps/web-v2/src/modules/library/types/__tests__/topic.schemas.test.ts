import * as v from 'valibot'
import { describe, expect, it } from 'vitest'

import { TopicSchema } from '../topic.schemas'

describe('TopicSchema', () => {
	it('normalizes numeric API IDs, including a nullable parent', () => {
		expect(
			v.parse(TopicSchema, {
				id: 12,
				parent_id: 4,
				title: 'Child',
				body: '',
			}),
		).toEqual({ id: '12', parentId: '4', title: 'Child', body: '' })
		expect(
			v.parse(TopicSchema, {
				id: 4,
				parent_id: null,
				title: 'Root',
				body: '',
			}),
		).toMatchObject({ id: '4', parentId: undefined })
	})
})
