import { afterEach, describe, expect, it, vi } from 'vitest'
import { getReviewQueue } from './getReviewQueue'

function buildNote(id: number, title: string) {
	return {
		id,
		title,
		body: '',
		parent_id: null,
		parent_title: null,
		last_review_rating: null,
		fsrs_state_id: null,
		reading_status: 'NEW' as const,
		reading_notes: '',
		in_reading_list: false,
		archived: false,
		inserted_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		stability: null,
		difficulty: null,
		state: 'new',
		step: null,
		srs_enabled: true,
		last_reviewed_at: null,
		retrievability: null,
		freshness_tier: null,
		days_until_next_tier: null,
		days_in_current_tier: null,
		tags: ['TOPIC'] as const,
		status_badges: []
	}
}

describe('getReviewQueue', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('fetches the full queue without pagination query params', async () => {
		const fetchMock = vi.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => ({
				items: [
					{
						queue_type: 'hazy' as const,
						entity_type: 'note' as const,
						note: buildNote(1, '0001 Pagination Item'),
						review_id: null,
						scheduled_at: null,
						days_until_due: null,
						days_until_hazy: 2,
						status_badges: []
					}
				],
				as_of: '2026-02-22'
			})
		}))

		vi.stubGlobal('fetch', fetchMock)

		const items = await getReviewQueue()

		expect(items).toHaveLength(1)
		expect(fetchMock).toHaveBeenCalledTimes(1)
		const firstCall = (fetchMock.mock.calls as Array<Array<unknown>>)[0]
		expect(firstCall).toBeDefined()
		const requestUrl = String(firstCall?.[0] ?? '')
		const requestInit = (firstCall?.[1] ?? {}) as RequestInit
		expect(requestUrl).toContain('/review-queue/')
		expect(requestUrl).not.toContain('limit=')
		expect(requestUrl).not.toContain('cursor=')
		expect(requestInit.credentials).toBe('include')
	})
})
