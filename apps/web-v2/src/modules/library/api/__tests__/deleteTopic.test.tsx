import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { reviewCardQueries, reviewQueries } from '~/modules/reviews/api/queries'
import type { Review, ReviewCard } from '~/modules/reviews/types/review.types'
import { createDeferred } from '~/testing/deferred'
import { getFetchRequest } from '~/testing/getFetchRequest'

import type { TopicWithChildren } from '../../types/topic.types'
import { deleteTopic, useDeleteTopic } from '../deleteTopic'
import { topicQueries } from '../queries'

describe('deleteTopic', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('sends an authenticated delete request', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response(null, { status: 204 }))
		vi.stubGlobal('fetch', fetchMock)

		await expect(deleteTopic('7')).resolves.toBeUndefined()
		expect(fetchMock).toHaveBeenCalledTimes(1)
		const request = getFetchRequest(fetchMock)
		expect(request.url).toBe('http://test-api/topics/7/')
		expect(request.method).toBe('DELETE')
		expect(request.credentials).toBe('include')
	})

	it('throws for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('', { status: 500 })),
		)
		await expect(deleteTopic('7')).rejects.toThrow('500')
	})

	function setup(client: QueryClient) {
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		return renderHook(useDeleteTopic, { wrapper })
	}

	it('removes cascading list data while retaining details until success', async () => {
		const deferred = createDeferred<Response>()
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))
		const client = new QueryClient()
		client.setQueryData(topicQueries.detail('7').queryKey, {
			id: '7',
			title: 'Topic',
			body: '',
		})
		client.setQueryData(topicQueries.list().queryKey, [
			{
				id: '7',
				title: 'Topic',
				body: '',
				children: [{ id: '8', title: 'Child', body: '', children: [] }],
			},
		])
		const deletedCardsQuery = reviewCardQueries.list({ topicId: '8' })
		const dueCardsQuery = reviewCardQueries.list({ due: 'new' })
		client.setQueryData(deletedCardsQuery.queryKey, [
			{
				id: '80',
				topic_id: '8',
				type: 'flashcard',
				primary_text: 'Question',
				secondary_text: 'Answer',
				notes: '',
				stability: null,
				last_reviewed_at: null,
				next_due_at: null,
				freshness_tier: null,
				flagged_at: null,
			},
		])
		client.setQueryData(dueCardsQuery.queryKey, [
			{
				id: '80',
				topic_id: '8',
				type: 'flashcard',
				primary_text: 'Deleted',
				secondary_text: '',
				notes: '',
				stability: null,
				last_reviewed_at: null,
				next_due_at: null,
				freshness_tier: null,
				flagged_at: null,
			},
			{
				id: '90',
				topic_id: '9',
				type: 'flashcard',
				primary_text: 'Unrelated',
				secondary_text: '',
				notes: '',
				stability: null,
				last_reviewed_at: null,
				next_due_at: null,
				freshness_tier: null,
				flagged_at: null,
			},
		])
		client.setQueryData(reviewCardQueries.detail('80').queryKey, {
			id: '80',
			topic_id: '8',
			type: 'flashcard',
			primary_text: 'Deleted',
			secondary_text: '',
			notes: '',
			stability: null,
			last_reviewed_at: null,
			next_due_at: null,
			freshness_tier: null,
			flagged_at: null,
		})
		const reviewsQuery = reviewQueries.list({ reviewCardId: '80' })
		client.setQueryData(reviewsQuery.queryKey, [
			{
				id: '800',
				review_card_id: '80',
				review_card: { topic_id: '8' },
			},
		] as Array<Review>)
		const invalidate = vi.spyOn(client, 'invalidateQueries')
		const { result } = setup(client)

		act(() => result.current.mutate('7'))
		await waitFor(() =>
			expect(client.getQueryData(topicQueries.list().queryKey)).toEqual(
				[],
			),
		)

		expect(
			client.getQueryData(topicQueries.detail('7').queryKey),
		).toBeDefined()
		expect(client.getQueryData(deletedCardsQuery.queryKey)).toBeDefined()
		expect(invalidate).not.toHaveBeenCalled()
		expect(client.getQueryData(dueCardsQuery.queryKey)).toEqual([
			{
				id: '90',
				topic_id: '9',
				type: 'flashcard',
				primary_text: 'Unrelated',
				secondary_text: '',
				notes: '',
				stability: null,
				last_reviewed_at: null,
				next_due_at: null,
				freshness_tier: null,
				flagged_at: null,
			},
		])

		deferred.resolve(new Response(null, { status: 204 }))
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: topicQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewCardQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewQueries.all }),
		)
		expect(
			client.getQueryData(topicQueries.detail('7').queryKey),
		).toBeUndefined()
		expect(client.getQueryData(deletedCardsQuery.queryKey)).toBeUndefined()
		expect(
			client.getQueryData(reviewCardQueries.detail('80').queryKey),
		).toBeUndefined()
		expect(client.getQueryData(reviewsQuery.queryKey)).toBeUndefined()
	})

	it('restores only its subtree and linked items when deletion fails', async () => {
		const deferred = createDeferred<Response>()
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))
		const client = new QueryClient({
			defaultOptions: { mutations: { retry: false } },
		})
		const topicList = topicQueries.list()
		client.setQueryData(topicList.queryKey, [
			{ id: '6', title: 'Before', body: '', children: [] },
			{
				id: '7',
				title: 'Deleted',
				body: '',
				children: [{ id: '8', title: 'Child', body: '', children: [] }],
			},
			{ id: '9', title: 'After', body: '', children: [] },
		] satisfies Array<TopicWithChildren>)
		const cardList = reviewCardQueries.list()
		client.setQueryData(cardList.queryKey, [
			{ id: '70', topic_id: '7' },
			{ id: '90', topic_id: '9' },
		] as Array<ReviewCard>)
		const reviewList = reviewQueries.list({ reviewCardId: '70' })
		client.setQueryData(reviewList.queryKey, [
			{
				id: '700',
				review_card_id: '70',
				review_card: { topic_id: '7' },
			},
		] as Array<Review>)
		const { result } = setup(client)

		act(() => result.current.mutate('7'))
		await waitFor(() =>
			expect(
				client
					.getQueryData<Array<TopicWithChildren>>(topicList.queryKey)
					?.map(topic => topic.id),
			).toEqual(['6', '9']),
		)
		client.setQueryData<Array<TopicWithChildren>>(
			topicList.queryKey,
			current =>
				current?.map(topic =>
					topic.id === '9' ? { ...topic, title: 'Later' } : topic,
				),
		)
		deferred.reject(new Error('failed'))
		await waitFor(() => expect(result.current.isError).toBe(true))

		expect(
			client
				.getQueryData<Array<TopicWithChildren>>(topicList.queryKey)
				?.map(topic => [topic.id, topic.title]),
		).toEqual([
			['6', 'Before'],
			['7', 'Deleted'],
			['9', 'Later'],
		])
		expect(
			client
				.getQueryData<Array<ReviewCard>>(cardList.queryKey)
				?.map(card => card.id),
		).toEqual(['70', '90'])
		expect(
			client
				.getQueryData<Array<Review>>(reviewList.queryKey)
				?.map(review => review.id),
		).toEqual(['700'])
	})
})
