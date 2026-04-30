import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getReviewCardQueuePage } from '~/features/review-cards/api/getReviewCardQueue'
import { getReviewCardQueueSummary } from '~/features/review-cards/api/getReviewCardQueueSummary'
import { apiFetch } from '~/utils/apiFetch'

vi.mock('~/utils/apiFetch', () => ({
	apiFetch: vi.fn()
}))

const apiFetchMock = vi.mocked(apiFetch)

function jsonResponse(body: unknown) {
	return new Response(JSON.stringify(body), {
		headers: { 'Content-Type': 'application/json' },
		status: 200
	})
}

describe('review card queue API', () => {
	beforeEach(() => {
		apiFetchMock.mockReset()
	})

	it('uses filter when requesting a unified queue', async () => {
		apiFetchMock.mockResolvedValue(
			jsonResponse({ items: [], as_of: '2026-01-15' })
		)

		await getReviewCardQueuePage({
			filter: 'all',
			include_future: true,
			limit: 10,
			mode: 'focus'
		})

		expect(apiFetchMock).toHaveBeenCalledWith(
			expect.stringContaining(
				'/review-cards/queue/?filter=all&mode=focus&include_future=true&limit=10'
			)
		)
	})

	it('keeps legacy type queue requests working', async () => {
		apiFetchMock.mockResolvedValue(
			jsonResponse({ items: [], as_of: '2026-01-15' })
		)

		await getReviewCardQueuePage({
			type: 'flashcard',
			mode: 'list'
		})

		expect(apiFetchMock).toHaveBeenCalledWith(
			expect.stringContaining('/review-cards/queue/?type=flashcard&mode=list')
		)
	})

	it('uses filter when requesting a unified queue summary', async () => {
		apiFetchMock.mockResolvedValue(
			jsonResponse({
				overdue_count: 1,
				due_today_count: 2,
				due_next_seven_days_count: 3,
				new_count: 4,
				as_of: '2026-01-15'
			})
		)

		await getReviewCardQueueSummary({ filter: 'all' })

		expect(apiFetchMock).toHaveBeenCalledWith(
			expect.stringContaining('/review-cards/queue-summary/?filter=all')
		)
	})

	it('keeps legacy type summary requests working', async () => {
		apiFetchMock.mockResolvedValue(
			jsonResponse({
				overdue_count: 1,
				due_today_count: 2,
				due_next_seven_days_count: 3,
				new_count: 4,
				as_of: '2026-01-15'
			})
		)

		await getReviewCardQueueSummary({ type: 'practice' })

		expect(apiFetchMock).toHaveBeenCalledWith(
			expect.stringContaining('/review-cards/queue-summary/?type=practice')
		)
	})
})
