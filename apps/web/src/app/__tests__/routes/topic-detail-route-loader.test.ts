import type { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { prefetchTopicDetailRouteData } from '~/app/routes/_main/_topic-layout/topics_.$topicId'
import { reviewCardsQueryOptions } from '~/features/review-cards/api/getReviewCards'
import { topicQueryOptions } from '~/features/topics/api/getTopic'
import { topicsQueryOptions } from '~/features/topics/api/getTopics'

function createDeferred() {
	let resolve!: (value: unknown) => void
	let reject!: (reason?: unknown) => void
	const promise = new Promise<unknown>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise
		reject = rejectPromise
	})

	return {
		promise,
		resolve,
		reject
	}
}

describe('prefetchTopicDetailRouteData', () => {
	it('starts topic detail queries without waiting for any of them', () => {
		const topicDeferred = createDeferred()
		const topicTreeDeferred = createDeferred()
		const subtreeDeferred = createDeferred()
		const reviewCardsDeferred = createDeferred()
		const prefetchQuery = vi
			.fn()
			.mockImplementationOnce(() => topicDeferred.promise)
			.mockImplementationOnce(() => topicTreeDeferred.promise)
			.mockImplementationOnce(() => subtreeDeferred.promise)
			.mockImplementationOnce(() => reviewCardsDeferred.promise)

		expect(
			prefetchTopicDetailRouteData({
				queryClient: { prefetchQuery } as Pick<QueryClient, 'prefetchQuery'>,
				topicId: 42
			})
		).toBeUndefined()

		expect(
			prefetchQuery.mock.calls.map(([options]) => options.queryKey)
		).toEqual([
			topicQueryOptions(42).queryKey,
			topicsQueryOptions({
				sort: 'title',
				order: 'asc'
			}).queryKey,
			topicsQueryOptions({
				subtree_of: 42,
				sort: 'title',
				order: 'asc'
			}).queryKey,
			reviewCardsQueryOptions({
				topic_id: 42,
				include_descendants: true,
				order: 'desc'
			}).queryKey
		])

		topicDeferred.resolve(undefined)
		topicTreeDeferred.resolve(undefined)
		subtreeDeferred.resolve(undefined)
		reviewCardsDeferred.resolve(undefined)
	})

	it('swallows prefetch failures so route navigation is not blocked', async () => {
		const prefetchQuery = vi
			.fn()
			.mockRejectedValueOnce(new Error('topic failed'))
			.mockRejectedValueOnce(new Error('tree failed'))
			.mockRejectedValueOnce(new Error('subtree failed'))
			.mockRejectedValueOnce(new Error('review cards failed'))

		expect(
			prefetchTopicDetailRouteData({
				queryClient: { prefetchQuery } as Pick<QueryClient, 'prefetchQuery'>,
				topicId: 7
			})
		).toBeUndefined()

		await Promise.resolve()
	})
})
