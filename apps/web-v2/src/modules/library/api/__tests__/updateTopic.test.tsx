import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { topicQueries } from '../queries'
import { updateTopic, useUpdateTopic } from '../updateTopic'

const response = { id: 7, parent_id: null, title: 'Edited', body: 'Body' }

describe('updateTopic', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('patches and parses a topic', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response(JSON.stringify(response), { status: 200 }),
			)
		vi.stubGlobal('fetch', fetchMock)
		await expect(
			updateTopic({ id: '7', title: 'Edited' }),
		).resolves.toMatchObject({
			id: '7',
			title: 'Edited',
		})
		expect(fetchMock).toHaveBeenCalledWith(
			new URL('http://test-api/topics/7/'),
			expect.objectContaining({
				method: 'PATCH',
				credentials: 'include',
				headers: expect.any(Headers),
				body: JSON.stringify({ title: 'Edited' }),
			}),
		)
	})

	it('throws for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('', { status: 500 })),
		)
		await expect(updateTopic({ id: '7', body: 'x' })).rejects.toThrow('500')
	})

	it('updates the normalized detail cache and invalidates lists', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(
					new Response(JSON.stringify(response), { status: 200 }),
				),
		)
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		})
		const invalidate = vi.spyOn(client, 'invalidateQueries')
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		const { result } = renderHook(useUpdateTopic, { wrapper })
		result.current.mutate({ id: '7', title: 'Edited' })
		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(
			client.getQueryData(topicQueries.detail('7').queryKey),
		).toMatchObject({
			title: 'Edited',
		})
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: topicQueries.lists(),
		})
	})
})
