import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createReviewCard } from '../createReviewCard'

describe('createReviewCard', () => {
	beforeEach(() => vi.stubEnv('VITE_API_URL', 'http://test-api'))
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it('serializes the numeric API topic ID and parses string frontend IDs', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			Response.json({
				id: 8,
				topic_id: 7,
				primary_text: 'Question',
				secondary_text: 'Answer',
				notes: '',
			}),
		)
		vi.stubGlobal('fetch', fetchMock)

		await expect(createReviewCard({ topicId: '7' })).resolves.toEqual({
			id: '8',
			topic_id: '7',
			primary_text: 'Question',
			secondary_text: 'Answer',
			notes: '',
		})
		expect(fetchMock).toHaveBeenCalledWith(
			new URL('http://test-api/review-cards/'),
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				headers: expect.any(Headers),
				body: JSON.stringify({ topic_id: 7, type: 'practice' }),
			}),
		)
	})
})
