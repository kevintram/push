import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDeferred } from '~/testing/deferred'
import { getFetchRequest } from '~/testing/getFetchRequest'

import type { Review, ReviewCard } from '../../types/review.types'
import { deleteReviewCard, useDeleteReviewCard } from '../deleteReviewCard'
import { reviewCardQueries, reviewQueries } from '../queries'

describe('deleteReviewCard', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	function setup(client: QueryClient) {
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		return renderHook(useDeleteReviewCard, { wrapper })
	}

	it('removes list entries while pending and retains detail data until success', async () => {
		const deferred = createDeferred<Response>()
		const fetchMock = vi.fn().mockReturnValue(deferred.promise)
		vi.stubGlobal('fetch', fetchMock)
		const client = new QueryClient()
		const card = {
			id: '8',
			topic_id: '7',
			type: 'flashcard',
			primary_text: 'Question',
			secondary_text: 'Answer',
			notes: '',
			stability: null,
			last_reviewed_at: null,
			next_due_at: null,
			freshness_tier: null,
			flagged_at: null,
		} satisfies ReviewCard
		client.setQueryData(reviewCardQueries.detail('8').queryKey, card)
		const cardsQuery = reviewCardQueries.list({ topicId: '7' })
		client.setQueryData(cardsQuery.queryKey, [
			{ ...card, id: '7' },
			card,
			{ ...card, id: '9' },
		])
		const reviewsQuery = reviewQueries.list({
			reviewCardId: '8',
			order: 'desc',
		})
		client.setQueryData(reviewsQuery.queryKey, [
			{ id: '1' },
		] as Array<Review>)
		const invalidate = vi.spyOn(client, 'invalidateQueries')
		const { result } = setup(client)

		act(() => result.current.mutate('8'))
		await waitFor(() =>
			expect(
				client
					.getQueryData<Array<ReviewCard>>(cardsQuery.queryKey)
					?.map(existing => existing.id),
			).toEqual(['7', '9']),
		)
		expect(
			client.getQueryData(reviewCardQueries.detail('8').queryKey),
		).toEqual(card)
		expect(client.getQueryData(reviewsQuery.queryKey)).toBeDefined()
		expect(invalidate).not.toHaveBeenCalled()

		deferred.resolve(new Response(null, { status: 204 }))
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const request = getFetchRequest(fetchMock)
		expect(request.url).toBe('http://test-api/review-cards/8/')
		expect(request.method).toBe('DELETE')
		expect(request.credentials).toBe('include')
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewCardQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledTimes(2)
		expect(
			client.getQueryData(reviewCardQueries.detail('8').queryKey),
		).toBeUndefined()
		expect(client.getQueryData(reviewsQuery.queryKey)).toBeUndefined()
	})

	it('restores the original position once when deletion fails', async () => {
		const deferred = createDeferred<Response>()
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))
		const client = new QueryClient({
			defaultOptions: { mutations: { retry: false } },
		})
		const query = reviewCardQueries.list({ topicId: '7' })
		const cards = ['7', '8', '9'].map(id => ({
			id,
			topic_id: '7',
		})) as Array<ReviewCard>
		client.setQueryData(query.queryKey, cards)
		const { result } = setup(client)

		act(() => result.current.mutate('8'))
		await waitFor(() =>
			expect(
				client
					.getQueryData<Array<ReviewCard>>(query.queryKey)
					?.map(card => card.id),
			).toEqual(['7', '9']),
		)
		deferred.reject(new Error('failed'))
		await waitFor(() => expect(result.current.isError).toBe(true))

		expect(
			client
				.getQueryData<Array<ReviewCard>>(query.queryKey)
				?.map(card => card.id),
		).toEqual(['7', '8', '9'])
	})

	it('throws for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('', { status: 404 })),
		)
		await expect(deleteReviewCard('8')).rejects.toThrow('404')
	})
})
