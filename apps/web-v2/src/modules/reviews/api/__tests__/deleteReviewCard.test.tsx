import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Review } from '../../types/review.types'
import { deleteReviewCard, useDeleteReviewCard } from '../deleteReviewCard'
import { reviewCardQueries, reviewQueries } from '../queries'

describe('deleteReviewCard', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('removes deleted data and refreshes only card lists', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response(null, { status: 204 }))
		vi.stubGlobal('fetch', fetchMock)
		const client = new QueryClient()
		client.setQueryData(reviewCardQueries.detail('8').queryKey, {
			id: '8',
			topic_id: '7',
			primary_text: 'Question',
			secondary_text: 'Answer',
			notes: '',
		})
		const reviewsQuery = reviewQueries.list({
			reviewCardId: '8',
			order: 'desc',
		})
		client.setQueryData(reviewsQuery.queryKey, [
			{ id: '1' },
		] as Array<Review>)
		const invalidate = vi.spyOn(client, 'invalidateQueries')
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		const { result } = renderHook(useDeleteReviewCard, { wrapper })

		result.current.mutate('8')
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(fetchMock).toHaveBeenCalledWith(
			new URL('http://test-api/review-cards/8/'),
			expect.objectContaining({
				method: 'DELETE',
				credentials: 'include',
			}),
		)
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: reviewCardQueries.lists(),
		})
		expect(invalidate).toHaveBeenCalledTimes(1)
		expect(
			client.getQueryData(reviewCardQueries.detail('8').queryKey),
		).toBeUndefined()
		expect(client.getQueryData(reviewsQuery.queryKey)).toBeUndefined()
	})

	it('throws for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('', { status: 404 })),
		)
		await expect(deleteReviewCard('8')).rejects.toThrow('404')
	})
})
