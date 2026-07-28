import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDeferred } from '~/testing/deferred'
import { getFetchRequest } from '~/testing/getFetchRequest'

import type { TopicWithChildren } from '../../types/topic.types'
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
		expect(fetchMock).toHaveBeenCalledTimes(1)
		const request = getFetchRequest(fetchMock)
		expect(request.url).toBe('http://test-api/topics/7/')
		expect(request.method).toBe('PATCH')
		expect(request.credentials).toBe('include')
		await expect(request.clone().json()).resolves.toEqual({
			title: 'Edited',
		})
	})

	it('throws for unsuccessful responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('', { status: 500 })),
		)
		await expect(updateTopic({ id: '7', body: 'x' })).rejects.toThrow('500')
	})

	function setup() {
		const client = new QueryClient({
			defaultOptions: {
				mutations: { retry: false },
				queries: { retry: false },
			},
		})
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={client}>
				{children}
			</QueryClientProvider>
		)
		return { client, ...renderHook(useUpdateTopic, { wrapper }) }
	}

	it('patches detail and tree caches before success without writing the response', async () => {
		const deferred = createDeferred<Response>()
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))
		const { client, result } = setup()
		const detail = { id: '7', title: 'Original', body: 'Body' }
		const list = [
			{ ...detail, children: [] },
			{ id: '8', title: 'Sibling', body: '', children: [] },
		] satisfies Array<TopicWithChildren>
		client.setQueryData(topicQueries.detail('7').queryKey, detail)
		client.setQueryData(topicQueries.list().queryKey, list)
		const invalidate = vi.spyOn(client, 'invalidateQueries')

		act(() => result.current.mutate({ id: '7', title: 'Edited' }))
		await waitFor(() =>
			expect(
				client.getQueryData<TopicWithChildren>(
					topicQueries.detail('7').queryKey,
				)?.title,
			).toBe('Edited'),
		)
		expect(
			client.getQueryData<Array<TopicWithChildren>>(
				topicQueries.list().queryKey,
			)?.[0]?.title,
		).toBe('Edited')
		expect(invalidate).not.toHaveBeenCalled()

		client.setQueryData<Array<TopicWithChildren>>(
			topicQueries.list().queryKey,
			current =>
				current?.map(topic =>
					topic.id === '8'
						? { ...topic, title: 'New sibling' }
						: topic,
				),
		)
		deferred.resolve(
			Response.json({
				...response,
				title: 'Stale server response',
			}),
		)
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		expect(
			client.getQueryData<TopicWithChildren>(
				topicQueries.detail('7').queryKey,
			)?.title,
		).toBe('Edited')
		expect(
			client
				.getQueryData<Array<TopicWithChildren>>(
					topicQueries.list().queryKey,
				)
				?.map(topic => topic.title),
		).toEqual(['Edited', 'New sibling'])
		expect(invalidate).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: topicQueries.all }),
		)
	})

	it('rolls back only supplied fields when the request fails', async () => {
		const deferred = createDeferred<Response>()
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))
		const { client, result } = setup()
		client.setQueryData(topicQueries.detail('7').queryKey, {
			id: '7',
			title: 'Original',
			body: 'Original body',
		})

		act(() => result.current.mutate({ id: '7', body: 'Optimistic body' }))
		await waitFor(() =>
			expect(
				client.getQueryData<TopicWithChildren>(
					topicQueries.detail('7').queryKey,
				)?.body,
			).toBe('Optimistic body'),
		)
		client.setQueryData<TopicWithChildren>(
			topicQueries.detail('7').queryKey,
			current =>
				current ? { ...current, title: 'Later title' } : current,
		)

		deferred.reject(new Error('failed'))
		await waitFor(() => expect(result.current.isError).toBe(true))

		expect(
			client.getQueryData(topicQueries.detail('7').queryKey),
		).toMatchObject({
			body: 'Original body',
			title: 'Later title',
		})
	})

	it('serializes overlapping saves and keeps the latest optimistic value', async () => {
		const first = createDeferred<Response>()
		const second = createDeferred<Response>()
		const fetchMock = vi
			.fn()
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise)
		vi.stubGlobal('fetch', fetchMock)
		const { client, result } = setup()
		client.setQueryData(topicQueries.detail('7').queryKey, {
			id: '7',
			title: 'Original',
			body: '',
		})

		act(() => {
			result.current.mutate({ id: '7', title: 'Older' })
			result.current.mutate({ id: '7', title: 'Newest' })
		})
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
		first.resolve(Response.json({ ...response, title: 'Older' }))
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
		expect(
			client.getQueryData<TopicWithChildren>(
				topicQueries.detail('7').queryKey,
			)?.title,
		).toBe('Newest')

		second.resolve(Response.json({ ...response, title: 'Newest' }))
		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(
			client.getQueryData<TopicWithChildren>(
				topicQueries.detail('7').queryKey,
			)?.title,
		).toBe('Newest')
	})
})
