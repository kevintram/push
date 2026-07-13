import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Review } from '../../types/review.types'
import { deleteReview, useDeleteReview } from '../deleteReview'
import { reviewCardQueries, reviewQueries } from '../queries'

describe('deleteReview', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('deletes the review and removes it from cached lists', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response('{}', { status: 200 }))
		vi.stubGlobal('fetch', fetchMock)
		const client = new QueryClient()
		const listQuery = reviewQueries.list({ reviewCardId: 8 })
		client.setQueryData(listQuery.queryKey, [
			{ id: 1 },
			{ id: 2 },
		] as Array<Review>)
		const invalidate = vi.spyOn(client, 'invalidateQueries')
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		const { result } = renderHook(useDeleteReview, { wrapper })

		result.current.mutate(1)
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(fetchMock).toHaveBeenCalledWith(
			new URL('http://test-api/reviews/1/'),
			{ method: 'DELETE', credentials: 'include' },
		)
		expect(client.getQueryData<Array<Review>>(listQuery.queryKey)).toEqual([
			{ id: 2 },
		])
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: reviewCardQueries.lists(),
		})
		expect(invalidate).toHaveBeenCalledTimes(1)
	})

	it('throws for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('', { status: 404 })),
		)
		await expect(deleteReview(1)).rejects.toThrow('404')
	})
})
