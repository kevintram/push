import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateReviewCard } from '../createReviewCard'
import { reviewCardQueries } from '../queries'

describe('useCreateReviewCard', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('seeds the real detail key and queues list refresh', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				Response.json({
					id: 43,
					topic_id: 42,
					type: 'practice',
					primary_text: '',
					secondary_text: '',
					notes: '',
					stability: null,
					last_reviewed_at: null,
					next_due_at: null,
					freshness_tier: null,
					flagged_at: null,
				}),
			),
		)
		const client = new QueryClient()
		const invalidate = vi.spyOn(client, 'invalidateQueries')
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		const { result } = renderHook(useCreateReviewCard, { wrapper })

		result.current.mutate({ topicId: '42' })
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(
			client.getQueryData(reviewCardQueries.detail('43').queryKey),
		).toMatchObject({ id: '43', topic_id: '42' })
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewCardQueries.lists() }),
		)
	})
})
