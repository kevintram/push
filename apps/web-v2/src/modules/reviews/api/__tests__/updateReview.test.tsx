import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

	function setup() {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(Response.json(rawUpdatedReview)),
		)
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

		expect(invalidate).toHaveBeenCalledWith({
			queryKey: reviewQueries.forCard(updatedReview.review_card_id),
		})
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: reviewCardQueries.all,
		})
		expect(invalidate).toHaveBeenCalledTimes(2)
	})

	it('invalidates review and review-card data after a rating update', async () => {
		const { client, result } = setup()
		const invalidate = vi.spyOn(client, 'invalidateQueries')

		result.current.mutate({ id: '3', rating: 'good' })
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(invalidate).toHaveBeenCalledWith({
			queryKey: reviewQueries.forCard(updatedReview.review_card_id),
		})
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: reviewCardQueries.all,
		})
		expect(invalidate).toHaveBeenCalledTimes(2)
	})

	it('continues patching cached lists for non-date updates', async () => {
		const { client, result } = setup()
		const listQuery = reviewQueries.list({ reviewCardId: '8' })
		client.setQueryData(listQuery.queryKey, [
			{ ...updatedReview, description: 'Old review' },
		])
		const invalidate = vi.spyOn(client, 'invalidateQueries')

		result.current.mutate({ id: '3', description: 'Updated review' })
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(client.getQueryData(listQuery.queryKey)).toEqual([updatedReview])
		expect(invalidate).not.toHaveBeenCalled()
	})
})
