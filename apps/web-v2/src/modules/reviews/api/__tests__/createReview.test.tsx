import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Review } from '../../types/review.types'
import { useCreateReview } from '../createReview'
import { reviewQueries } from '../queries'

describe('useCreateReview', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('adds the created review only to the affected card lists', async () => {
		const createdReview = {
			id: '3',
			review_card_id: '8',
			rating: null,
			description: '',
			notes: '',
			scheduled_at: null,
			completed_at: null,
			effective_date: null,
			inserted_at: '2026-07-13T00:00:00Z',
			updated_at: '2026-07-13T00:00:00Z',
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
		const rawCreatedReview = {
			...createdReview,
			id: 3,
			review_card_id: 8,
			review_card: { ...createdReview.review_card, id: 8, topic_id: 7 },
		}
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(Response.json(rawCreatedReview)),
		)
		const client = new QueryClient()
		const descendingQuery = reviewQueries.list({
			reviewCardId: '8',
			order: 'desc',
		})
		const ascendingQuery = reviewQueries.list({
			reviewCardId: '8',
			order: 'asc',
		})
		const unrelatedQuery = reviewQueries.list({ reviewCardId: '9' })
		client.setQueryData(descendingQuery.queryKey, [
			{ id: '2' },
		] as Array<Review>)
		client.setQueryData(ascendingQuery.queryKey, [
			{ id: '1' },
		] as Array<Review>)
		client.setQueryData(unrelatedQuery.queryKey, [
			{ id: '4' },
		] as Array<Review>)
		const invalidate = vi.spyOn(client, 'invalidateQueries')
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		const { result } = renderHook(useCreateReview, { wrapper })

		result.current.mutate({ reviewCardId: '8' })
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(
			client
				.getQueryData<Array<Review>>(descendingQuery.queryKey)
				?.map(review => review.id),
		).toEqual(['3', '2'])
		expect(
			client
				.getQueryData<Array<Review>>(ascendingQuery.queryKey)
				?.map(review => review.id),
		).toEqual(['1', '3'])
		expect(
			client
				.getQueryData<Array<Review>>(unrelatedQuery.queryKey)
				?.map(review => review.id),
		).toEqual(['4'])
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: reviewQueries.forCard('8') }),
		)
	})
})
