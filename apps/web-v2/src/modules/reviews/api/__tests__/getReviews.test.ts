import { afterEach, describe, expect, it, vi } from 'vitest'

import { getFetchRequest } from '~/testing/getFetchRequest'

import { fetchReviews } from '../getReviews'

describe('fetchReviews', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('requests descending reviews for one review card with credentials', async () => {
		vi.stubEnv('VITE_API_URL', 'http://test-api')
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify([]), {
				status: 200,
			}),
		)
		vi.stubGlobal('fetch', fetchMock)

		await expect(
			fetchReviews({ reviewCardId: '42', order: 'desc' }),
		).resolves.toEqual([])
		expect(fetchMock).toHaveBeenCalledTimes(1)
		const request = getFetchRequest(fetchMock)
		expect(request.url).toBe(
			'http://test-api/reviews/?review_card_id=42&order=desc',
		)
		expect(request.credentials).toBe('include')
	})
})
