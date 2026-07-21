import { describe, expect, it } from 'vitest'

import { topicQueries } from '~/modules/library/api/queries'

import { reviewCardQueries, reviewQueries } from '../queries'

describe('query factories', () => {
	it('normalizes legacy numeric IDs at the key boundary', () => {
		expect(
			reviewCardQueries.list({ topicId: 5 as never }).queryKey,
		).toEqual(reviewCardQueries.list({ topicId: '5' }).queryKey)
		expect(topicQueries.detail(5 as never).queryKey).toEqual(
			topicQueries.detail('5').queryKey,
		)
	})

	it('uses the same review key for omitted and default order', () => {
		expect(reviewQueries.list({ reviewCardId: '5' }).queryKey).toEqual(
			reviewQueries.list({ reviewCardId: '5', order: 'desc' }).queryKey,
		)
	})
})
