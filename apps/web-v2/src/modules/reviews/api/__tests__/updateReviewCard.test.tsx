import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { reviewCardQueries } from '../queries'
import { updateReviewCard, useUpdateReviewCard } from '../updateReviewCard'

const response = {
	id: 8,
	topic_id: 7,
	primary_text: 'Question',
	secondary_text: 'Answer',
	notes: 'Notes',
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
			updateReviewCard({ id: 8, notes: 'Notes' }),
		).resolves.toEqual(response)
		expect(fetchMock).toHaveBeenCalledWith(
			new URL('http://test-api/review-cards/8/'),
			expect.objectContaining({
				method: 'PATCH',
				credentials: 'include',
				headers: expect.any(Headers),
				body: JSON.stringify({ notes: 'Notes' }),
			}),
		)
	})

	it('throws for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('', { status: 404 })),
		)
		await expect(updateReviewCard({ id: 8, notes: 'x' })).rejects.toThrow(
			'404',
		)
	})

	it('updates detail cache and invalidates lists', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(
					new Response(JSON.stringify(response), { status: 200 }),
				),
		)
		const client = new QueryClient()
		const invalidate = vi.spyOn(client, 'invalidateQueries')
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		const { result } = renderHook(useUpdateReviewCard, { wrapper })
		result.current.mutate({ id: 8, notes: 'Notes' })
		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(
			client.getQueryData(reviewCardQueries.detail(8).queryKey),
		).toEqual(response)
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: reviewCardQueries.lists(),
		})
	})
})
