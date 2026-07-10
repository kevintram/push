import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchTopics } from '../getTopics'

describe('getTopics', () => {
	beforeEach(() => {
		vi.stubEnv('VITE_API_URL', 'http://test-api')
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('converts API parent IDs and nests child topics', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify([
						{ id: 1, parent_id: null, title: 'Root', body: '' },
						{ id: 2, parent_id: 1, title: 'Child', body: '' },
					]),
					{ status: 200 },
				),
			),
		)

		await expect(fetchTopics()).resolves.toEqual([
			{
				id: 1,
				title: 'Root',
				body: '',
				parentId: undefined,
				children: [
					{
						id: 2,
						title: 'Child',
						body: '',
						parentId: 1,
						children: [],
					},
				],
			},
		])
	})
})
