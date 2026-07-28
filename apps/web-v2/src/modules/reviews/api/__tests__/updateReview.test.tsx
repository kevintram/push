import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDeferred } from '~/testing/deferred'

import type { Review } from '../../types/review.types'
import { reviewCardQueries, reviewQueries } from '../queries'
import { useUpdateReview } from '../updateReview'

const updatedReview = {
	id: '3',
	review_card_id: '8',
	rating: 'good',
	description: 'Updated review',
	notes: '',
	scheduled_at: '2026-07-21',
	completed_at: null,
	effective_date: '2026-07-21',
	inserted_at: '2026-07-13T00:00:00Z',
	updated_at: '2026-07-20T00:00:00Z',
	review_card: {
		id: '8',
		topic_id: '7',
		type: 'practice',
		primary_text: 'Question',
		secondary_text: 'Answer',
	},
	stability_before: null,
	difficulty_before: null,
	state_before: null,
	step_before: null,
	due_before: null,
	stability_after: null,
	difficulty_after: null,
	state_after: null,
	step_after: null,
	due_after: null,
} satisfies Review

const rawUpdatedReview = {
	...updatedReview,
	id: 3,
	review_card_id: 8,
	review_card: { ...updatedReview.review_card, id: 8, topic_id: 7 },
}

describe('useUpdateReview', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	function setup(
		fetchMock = vi.fn().mockResolvedValue(Response.json(rawUpdatedReview)),
	) {
		vi.stubGlobal('fetch', fetchMock)
		const client = new QueryClient()
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		const hook = renderHook(useUpdateReview, { wrapper })
		return { client, ...hook }
	}

	it('invalidates review and review-card data after a date update', async () => {
		const { client, result } = setup()
		const invalidate = vi.spyOn(client, 'invalidateQueries')

		result.current.mutate({ id: '3', scheduled_at: '2026-07-21' })
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewCardQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledTimes(2)
	})

	it('invalidates review and review-card data after a rating update', async () => {
		const { client, result } = setup()
		const invalidate = vi.spyOn(client, 'invalidateQueries')

		result.current.mutate({ id: '3', rating: 'good' })
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewCardQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledTimes(2)
	})

	it('patches text before the response and does not write stale success data', async () => {
		const deferred = createDeferred<Response>()
		const { client, result } = setup(
			vi.fn().mockReturnValue(deferred.promise),
		)
		const listQuery = reviewQueries.list({ reviewCardId: '8' })
		client.setQueryData(listQuery.queryKey, [
			{ ...updatedReview, description: 'Old review' },
		])
		const invalidate = vi.spyOn(client, 'invalidateQueries')

		act(() =>
			result.current.mutate({
				id: '3',
				description: 'Optimistic review',
			}),
		)
		await waitFor(() =>
			expect(
				client.getQueryData<Array<Review>>(listQuery.queryKey)?.[0]
					?.description,
			).toBe('Optimistic review'),
		)
		expect(invalidate).not.toHaveBeenCalled()

		deferred.resolve(
			Response.json({
				...rawUpdatedReview,
				description: 'Stale server response',
			}),
		)
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(
			client.getQueryData<Array<Review>>(listQuery.queryKey)?.[0]
				?.description,
		).toBe('Optimistic review')
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewQueries.all }),
		)
	})

	it('does not optimistically synthesize scheduling fields', async () => {
		const deferred = createDeferred<Response>()
		const { client, result } = setup(
			vi.fn().mockReturnValue(deferred.promise),
		)
		const listQuery = reviewQueries.list({ reviewCardId: '8' })
		client.setQueryData(listQuery.queryKey, [
			{ ...updatedReview, rating: null, completed_at: null },
		])

		act(() =>
			result.current.mutate({
				id: '3',
				rating: 'good',
				completed_at: '2026-07-21',
			}),
		)
		await waitFor(() => expect(result.current.isPending).toBe(true))
		expect(
			client.getQueryData<Array<Review>>(listQuery.queryKey)?.[0],
		).toMatchObject({ completed_at: null, rating: null })

		deferred.resolve(Response.json(rawUpdatedReview))
		await waitFor(() => expect(result.current.isSuccess).toBe(true))
	})

	it('restores only failed text fields', async () => {
		const deferred = createDeferred<Response>()
		const { client, result } = setup(
			vi.fn().mockReturnValue(deferred.promise),
		)
		const listQuery = reviewQueries.list({ reviewCardId: '8' })
		client.setQueryData(listQuery.queryKey, [
			{ ...updatedReview, description: 'Old', notes: 'Old notes' },
		])

		act(() => result.current.mutate({ id: '3', description: 'New' }))
		await waitFor(() =>
			expect(
				client.getQueryData<Array<Review>>(listQuery.queryKey)?.[0]
					?.description,
			).toBe('New'),
		)
		client.setQueryData<Array<Review>>(listQuery.queryKey, current =>
			current?.map(review => ({ ...review, notes: 'Later notes' })),
		)
		deferred.reject(new Error('failed'))
		await waitFor(() => expect(result.current.isError).toBe(true))

		expect(
			client.getQueryData<Array<Review>>(listQuery.queryKey)?.[0],
		).toMatchObject({ description: 'Old', notes: 'Later notes' })
	})
})
