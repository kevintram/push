import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateTopic } from '../createTopic'
import { topicQueries } from '../queries'

describe('useCreateTopic', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('seeds only the server-assigned detail key and queues list refresh', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				Response.json({
					id: 42,
					parent_id: null,
					title: '',
					body: '',
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
		const { result } = renderHook(useCreateTopic, { wrapper })

		result.current.mutate({})
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(client.getQueryData(topicQueries.detail('42').queryKey)).toEqual(
			{
				id: '42',
				title: '',
				body: '',
			},
		)
		expect(
			client
				.getQueryCache()
				.getAll()
				.some(query =>
					query.queryKey.some(
						segment =>
							typeof segment === 'string' &&
							segment.startsWith('temp:'),
					),
				),
		).toBe(false)
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: topicQueries.lists() }),
		)
	})
})
