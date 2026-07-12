import type { Review } from '../types/review.types'

export type ReviewGroups = {
	uncompleted: Array<Review>
	overdue: Array<Review>
	today: Array<Review>
	upcoming: Array<Review>
	completed: Array<Review>
}

export function groupReviews(
	reviews: Array<Review>,
	today: string,
): ReviewGroups {
	const groups: ReviewGroups = {
		uncompleted: [],
		overdue: [],
		today: [],
		upcoming: [],
		completed: [],
	}

	for (const review of reviews) {
		if (review.completed_at !== null) {
			groups.completed.push(review)
			continue
		}

		const scheduledDate = review.effective_date ?? review.scheduled_at
		if (scheduledDate === null) {
			groups.uncompleted.push(review)
		} else if (scheduledDate < today) {
			groups.overdue.push(review)
		} else if (scheduledDate === today) {
			groups.today.push(review)
		} else {
			groups.upcoming.push(review)
		}
	}

	const byEffectiveDate = (a: Review, b: Review) =>
		(a.effective_date ?? '').localeCompare(b.effective_date ?? '')
	groups.overdue.sort(byEffectiveDate)
	groups.today.sort(byEffectiveDate)
	groups.upcoming.sort(byEffectiveDate)
	groups.uncompleted.sort((a, b) =>
		b.inserted_at.localeCompare(a.inserted_at),
	)
	groups.completed.sort((a, b) =>
		(b.completed_at ?? '').localeCompare(a.completed_at ?? ''),
	)

	return groups
}

export function getLatestCompletedReview(
	reviews: Array<Review>,
): Review | undefined {
	return reviews
		.filter(review => review.completed_at !== null)
		.toSorted((a, b) =>
			(b.completed_at ?? '').localeCompare(a.completed_at ?? ''),
		)[0]
}
