import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDeferred } from '~/testing/deferred'
import { getFetchRequest } from '~/testing/getFetchRequest'

import type { Review, ReviewCard } from '../../types/review.types'
import { reviewCardQueries, reviewQueries } from '../queries'
import { updateReviewCard, useUpdateReviewCard } from '../updateReviewCard'

const response = {
	id: 8,
	topic_id: 7,
	type: 'flashcard' as const,
	primary_text: 'Question',
	secondary_text: 'Answer',
	notes: 'Notes',
	stability: null,
	last_reviewed_at: null,
	next_due_at: null,
	freshness_tier: null,
	flagged_at: null,
}

describe('updateReviewCard', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('patches and parses a review card', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response(JSON.stringify(response), { status: 200 }),
			)
		vi.stubGlobal('fetch', fetchMock)
		await expect(
			updateReviewCard({ id: '8', notes: 'Notes' }),
		).resolves.toEqual({ ...response, id: '8', topic_id: '7' })
		expect(fetchMock).toHaveBeenCalledTimes(1)
		const request = getFetchRequest(fetchMock)
		expect(request.url).toBe('http://test-api/review-cards/8/')
		expect(request.method).toBe('PATCH')
		expect(request.credentials).toBe('include')
		await expect(request.clone().json()).resolves.toEqual({
			notes: 'Notes',
		})
	})

	it('throws for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('', { status: 404 })),
		)
		await expect(updateReviewCard({ id: '8', notes: 'x' })).rejects.toThrow(
			'404',
		)
	})

	function setup() {
		const client = new QueryClient({
			defaultOptions: { mutations: { retry: false } },
		})
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		return { client, ...renderHook(useUpdateReviewCard, { wrapper }) }
	}

	it('patches card caches and embedded summaries before success', async () => {
		const deferred = createDeferred<Response>()
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))
		const { client, result } = setup()
		const card = {
			...response,
			id: '8',
			topic_id: '7',
			primary_text: 'Original',
		} satisfies ReviewCard
		const cardList = reviewCardQueries.list({ topicId: '7' })
		const reviewList = reviewQueries.list({ reviewCardId: '8' })
		client.setQueryData(reviewCardQueries.detail('8').queryKey, card)
		client.setQueryData(cardList.queryKey, [card])
		client.setQueryData(reviewList.queryKey, [
			{
				id: '3',
				review_card: {
					id: '8',
					topic_id: '7',
					type: 'flashcard',
					primary_text: 'Original',
					secondary_text: 'Answer',
				},
			},
		] as Array<Review>)
		const invalidate = vi.spyOn(client, 'invalidateQueries')

		act(() =>
			result.current.mutate({
				id: '8',
				flagged: true,
				primary_text: 'Optimistic',
				type: 'practice',
			}),
		)
		await waitFor(() =>
			expect(
				client.getQueryData<ReviewCard>(
					reviewCardQueries.detail('8').queryKey,
				)?.primary_text,
			).toBe('Optimistic'),
		)
		expect(
			client.getQueryData<Array<ReviewCard>>(cardList.queryKey)?.[0]
				?.flagged_at,
		).not.toBe(null)
		expect(
			client.getQueryData<Array<Review>>(reviewList.queryKey)?.[0]
				?.review_card,
		).toMatchObject({
			primary_text: 'Optimistic',
			type: 'practice',
		})
		expect(invalidate).not.toHaveBeenCalled()

		deferred.resolve(
			Response.json({ ...response, primary_text: 'Stale server value' }),
		)
		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(
			client.getQueryData<ReviewCard>(
				reviewCardQueries.detail('8').queryKey,
			)?.primary_text,
		).toBe('Optimistic')
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewCardQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewQueries.all }),
		)
	})

	it('rolls back only changed fields and leaves sibling changes intact', async () => {
		const deferred = createDeferred<Response>()
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))
		const { client, result } = setup()
		const query = reviewCardQueries.list()
		client.setQueryData(query.queryKey, [
			{ ...response, id: '8', topic_id: '7', notes: 'Old notes' },
			{ ...response, id: '9', topic_id: '7', primary_text: 'Sibling' },
		] satisfies Array<ReviewCard>)

		act(() => result.current.mutate({ id: '8', notes: 'New notes' }))
		await waitFor(() =>
			expect(
				client.getQueryData<Array<ReviewCard>>(query.queryKey)?.[0]
					?.notes,
			).toBe('New notes'),
		)
		client.setQueryData<Array<ReviewCard>>(query.queryKey, current =>
			current?.map(card =>
				card.id === '9'
					? { ...card, primary_text: 'Later sibling' }
					: card,
			),
		)
		deferred.reject(new Error('failed'))
		await waitFor(() => expect(result.current.isError).toBe(true))

		expect(
			client
				.getQueryData<Array<ReviewCard>>(query.queryKey)
				?.map(card => [card.id, card.notes, card.primary_text]),
		).toEqual([
			['8', 'Old notes', 'Question'],
			['9', 'Notes', 'Later sibling'],
		])
	})
})
