import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getFetchRequest } from '~/testing/getFetchRequest'

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
				type: 'practice',
				primary_text: 'Question',
				secondary_text: 'Answer',
				notes: '',
				stability: null,
				last_reviewed_at: null,
				next_due_at: null,
				freshness_tier: null,
				flagged_at: null,
			}),
		)
		vi.stubGlobal('fetch', fetchMock)

		await expect(createReviewCard({ topicId: '7' })).resolves.toEqual({
			id: '8',
			topic_id: '7',
			type: 'practice',
			primary_text: 'Question',
			secondary_text: 'Answer',
			notes: '',
			stability: null,
			last_reviewed_at: null,
			next_due_at: null,
			freshness_tier: null,
			flagged_at: null,
		})
		expect(fetchMock).toHaveBeenCalledTimes(1)
		const request = getFetchRequest(fetchMock)
		expect(request.url).toBe('http://test-api/review-cards/')
		expect(request.method).toBe('POST')
		expect(request.credentials).toBe('include')
		await expect(request.clone().json()).resolves.toEqual({
			topic_id: 7,
			type: 'practice',
		})
	})
})
