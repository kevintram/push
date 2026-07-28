import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDeferred } from '~/testing/deferred'
import { getFetchRequest } from '~/testing/getFetchRequest'

import type { Review } from '../../types/review.types'
import { deleteReview, useDeleteReview } from '../deleteReview'
import { reviewCardQueries, reviewQueries } from '../queries'

describe('deleteReview', () => {
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
		return renderHook(useDeleteReview, { wrapper })
	}

	it('removes the review while the request is pending and invalidates on settle', async () => {
		const deferred = createDeferred<Response>()
		const fetchMock = vi.fn().mockReturnValue(deferred.promise)
		vi.stubGlobal('fetch', fetchMock)
		const client = new QueryClient()
		const listQuery = reviewQueries.list({ reviewCardId: '8' })
		client.setQueryData(listQuery.queryKey, [
			{ id: '1' },
			{ id: '2' },
		] as Array<Review>)
		const invalidate = vi.spyOn(client, 'invalidateQueries')
		const { result } = setup(client)

		act(() => result.current.mutate('1'))
		await waitFor(() =>
			expect(
				client
					.getQueryData<Array<Review>>(listQuery.queryKey)
					?.map(review => review.id),
			).toEqual(['2']),
		)
		expect(invalidate).not.toHaveBeenCalled()

		deferred.resolve(new Response('{}', { status: 200 }))
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const request = getFetchRequest(fetchMock)
		expect(request.url).toBe('http://test-api/reviews/1/')
		expect(request.method).toBe('DELETE')
		expect(request.credentials).toBe('include')
		expect(client.getQueryData<Array<Review>>(listQuery.queryKey)).toEqual([
			{ id: '2' },
		])
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewCardQueries.all }),
		)
		expect(invalidate).toHaveBeenCalledTimes(2)
	})

	it('restores ordering without duplicating an already-restored review', async () => {
		const deferred = createDeferred<Response>()
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))
		const client = new QueryClient({
			defaultOptions: { mutations: { retry: false } },
		})
		const query = reviewQueries.list({ reviewCardId: '8' })
		client.setQueryData(query.queryKey, [
			{ id: '1' },
			{ id: '2' },
			{ id: '3' },
		] as Array<Review>)
		const { result } = setup(client)

		act(() => result.current.mutate('2'))
		await waitFor(() =>
			expect(
				client
					.getQueryData<Array<Review>>(query.queryKey)
					?.map(review => review.id),
			).toEqual(['1', '3']),
		)
		client.setQueryData<Array<Review>>(query.queryKey, current => [
			current![0]!,
			{ id: '2' } as Review,
			current![1]!,
		])
		deferred.reject(new Error('failed'))
		await waitFor(() => expect(result.current.isError).toBe(true))

		expect(
			client
				.getQueryData<Array<Review>>(query.queryKey)
				?.map(review => review.id),
		).toEqual(['1', '2', '3'])
	})

	it('throws for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('', { status: 404 })),
		)
		await expect(deleteReview('1')).rejects.toThrow('404')
	})
})
