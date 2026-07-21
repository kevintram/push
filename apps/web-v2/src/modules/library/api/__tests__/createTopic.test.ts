import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createTopic } from '../createTopic'

describe('createTopic', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('creates a child topic with the selected parent', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					id: 8,
					parent_id: 7,
					title: '',
					body: '',
				}),
				{ status: 201 },
			),
		)
		vi.stubGlobal('fetch', fetchMock)

		await expect(createTopic({ parentId: '7' })).resolves.toMatchObject({
			id: '8',
			parentId: '7',
		})
		expect(fetchMock).toHaveBeenCalledWith(
			new URL('http://test-api/topics/'),
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				headers: expect.any(Headers),
				body: JSON.stringify({ parent_id: 7 }),
			}),
		)
	})
})
