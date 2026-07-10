import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchReviewCards } from '../getReviewCards'

describe('fetchReviewCards', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
		vi.unstubAllGlobals()
	})

	it('parses the camelCase projection and preserves review filters', async () => {
		vi.stubEnv('VITE_API_URL', 'https://api.example.com')
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
			new Response(
				JSON.stringify([
					{
						id: 7,
						primaryText: 'Prompt',
						secondaryText: 'Details',
					},
				]),
				{ status: 200 },
			),
		)
		vi.stubGlobal('fetch', fetchMock)

		await expect(fetchReviewCards({ due: 'late' })).resolves.toEqual([
			{
				id: 7,
				primaryText: 'Prompt',
				secondaryText: 'Details',
			},
		])
		expect(fetchMock).toHaveBeenCalledWith(
			new URL('https://api.example.com/review-cards/?due=late'),
			{ credentials: 'include' },
		)
	})

	it('rejects the previous snake_case response fields', async () => {
		vi.stubEnv('VITE_API_URL', 'https://api.example.com')
		vi.stubGlobal(
			'fetch',
			vi.fn<typeof fetch>().mockResolvedValue(
				new Response(
					JSON.stringify([
						{
							id: 7,
							primary_text: 'Prompt',
							secondary_text: 'Details',
						},
					]),
					{ status: 200 },
				),
			),
		)

		await expect(fetchReviewCards()).rejects.toThrow()
	})
})
