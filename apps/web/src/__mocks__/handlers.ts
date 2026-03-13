import { delay, HttpResponse, http } from 'msw'
import fruits from './data/fruits.json' with { type: 'json' }

export const handlers = [
	http.get('/fruits', async () => {
		await delay('real')
		return HttpResponse.json(fruits)
	}),
	http.get('*/review-cards/queue-summary/', () => {
		return HttpResponse.json({
			overdue_count: 0,
			due_today_count: 0,
			due_next_seven_days_count: 0,
			new_count: 0,
			as_of: '2026-03-05'
		})
	}),
	http.get('*/review-cards/flagged-summary/', () => {
		return HttpResponse.json({
			flagged_count: 0
		})
	}),
	http.get('*/topics/', ({ request }) => {
		const url = new URL(request.url)
		if (
			url.searchParams.get('root') === 'true' &&
			url.searchParams.get('sort') === 'title' &&
			url.searchParams.get('order') === 'asc'
		) {
			return HttpResponse.json([])
		}
	})
]
