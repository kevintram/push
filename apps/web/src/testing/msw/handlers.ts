import { delay, http, HttpResponse } from 'msw'

import fruits from './data/fruits.json' with { type: 'json' }

export const handlers = [
	http.get('/fruits', async () => {
		await delay('real')
		return HttpResponse.json(fruits)
	}),
	http.get('*/review-cards/queue-summary/', () =>
		HttpResponse.json({
			overdueCount: 0,
			dueTodayCount: 0,
			dueNextSevenDaysCount: 0,
			newCount: 0,
			asOf: '2026-03-05',
		}),
	),
	http.get('*/review-cards/flagged-summary/', () =>
		HttpResponse.json({
			flaggedCount: 0,
		}),
	),
	http.get('*/topics/', ({ request }) => {
		const url = new URL(request.url)
		if (
			url.searchParams.get('root') === 'true' &&
			url.searchParams.get('sort') === 'title' &&
			url.searchParams.get('order') === 'asc'
		) {
			return HttpResponse.json([])
		}
	}),
]
