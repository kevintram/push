import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { reviewCardQueries, reviewQueries } from '~/modules/reviews/api/queries'
import type { Review } from '~/modules/reviews/types/review.types'
import { getFetchRequest } from '~/testing/getFetchRequest'

import { deleteTopic, useDeleteTopic } from '../deleteTopic'
import { topicQueries } from '../queries'

describe('deleteTopic', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('sends an authenticated delete request', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response(null, { status: 204 }))
		vi.stubGlobal('fetch', fetchMock)

		await expect(deleteTopic('7')).resolves.toBeUndefined()
		expect(fetchMock).toHaveBeenCalledTimes(1)
		const request = getFetchRequest(fetchMock)
		expect(request.url).toBe('http://test-api/topics/7/')
		expect(request.method).toBe('DELETE')
		expect(request.credentials).toBe('include')
	})

	it('throws for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('', { status: 500 })),
		)
		await expect(deleteTopic('7')).rejects.toThrow('500')
	})

	it('updates the topic tree and removes only cascading cache data', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
		)
		const client = new QueryClient()
		client.setQueryData(topicQueries.detail('7').queryKey, {
			id: '7',
			title: 'Topic',
			body: '',
		})
		client.setQueryData(topicQueries.list().queryKey, [
			{
				id: '7',
				title: 'Topic',
				body: '',
				children: [{ id: '8', title: 'Child', body: '', children: [] }],
			},
		])
		const deletedCardsQuery = reviewCardQueries.list({ topicId: '8' })
		const dueCardsQuery = reviewCardQueries.list({ due: 'new' })
		client.setQueryData(deletedCardsQuery.queryKey, [
			{
				id: '80',
				topic_id: '8',
				primary_text: 'Question',
				secondary_text: 'Answer',
				notes: '',
			},
		])
		client.setQueryData(dueCardsQuery.queryKey, [
			{
				id: '80',
				topic_id: '8',
				primary_text: 'Deleted',
				secondary_text: '',
				notes: '',
			},
			{
				id: '90',
				topic_id: '9',
				primary_text: 'Unrelated',
				secondary_text: '',
				notes: '',
			},
		])
		client.setQueryData(reviewCardQueries.detail('80').queryKey, {
			id: '80',
			topic_id: '8',
			primary_text: 'Deleted',
			secondary_text: '',
			notes: '',
		})
		const reviewsQuery = reviewQueries.list({ reviewCardId: '80' })
		client.setQueryData(reviewsQuery.queryKey, [
			{
				id: '800',
				review_card_id: '80',
				review_card: { topic_id: '8' },
			},
		] as Array<Review>)
		const invalidate = vi.spyOn(client, 'invalidateQueries')
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		const { result } = renderHook(useDeleteTopic, { wrapper })

		result.current.mutate('7')
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(client.getQueryData(topicQueries.list().queryKey)).toEqual([])
		expect(invalidate).not.toHaveBeenCalled()
		expect(
			client.getQueryData(topicQueries.detail('7').queryKey),
		).toBeUndefined()
		expect(client.getQueryData(deletedCardsQuery.queryKey)).toBeUndefined()
		expect(
			client.getQueryData(reviewCardQueries.detail('80').queryKey),
		).toBeUndefined()
		expect(client.getQueryData(reviewsQuery.queryKey)).toBeUndefined()
		expect(client.getQueryData(dueCardsQuery.queryKey)).toEqual([
			{
				id: '90',
				topic_id: '9',
				primary_text: 'Unrelated',
				secondary_text: '',
				notes: '',
			},
		])
	})
})
