import { localDateString } from '~/utils/date'

import { type ReviewListItem } from '../types/review.types'

export function splitReviews(reviews: Array<ReviewListItem>) {
	const today = localDateString()
	const uncompletedUnscheduled: Array<ReviewListItem> = []
	const overdue: Array<ReviewListItem> = []
	const todayReviews: Array<ReviewListItem> = []
	const upcoming: Array<ReviewListItem> = []
	const completed: Array<ReviewListItem> = []

	for (const review of reviews) {
		if (review.completedAt) {
			completed.push(review)
			continue
		}

		if (review.scheduledAt || review.effectiveDate) {
			const date = review.effectiveDate ?? review.scheduledAt
			if (date && date < today) {
				overdue.push(review)
			} else if (date && date === today) {
				todayReviews.push(review)
			} else {
				upcoming.push(review)
			}
			continue
		}

		uncompletedUnscheduled.push(review)
	}

	const sortByEffectiveDateAsc = (a: ReviewListItem, b: ReviewListItem) =>
		new Date(a.effectiveDate ?? 0).getTime() -
		new Date(b.effectiveDate ?? 0).getTime()

	overdue.sort(sortByEffectiveDateAsc)
	todayReviews.sort(sortByEffectiveDateAsc)
	upcoming.sort(sortByEffectiveDateAsc)
	uncompletedUnscheduled.sort(
		(a, b) =>
			new Date(b.insertedAt).getTime() - new Date(a.insertedAt).getTime(),
	)
	completed.sort(
		(a, b) =>
			new Date(b.completedAt ?? b.effectiveDate ?? 0).getTime() -
			new Date(a.completedAt ?? a.effectiveDate ?? 0).getTime(),
	)

	return {
		uncompletedUnscheduledReviews: uncompletedUnscheduled,
		overdueReviews: overdue,
		todayReviews,
		upcomingReviews: upcoming,
		completedReviews: completed,
	}
}

export function getLatestCompletedReview(reviews: Array<ReviewListItem>) {
	let latest: ReviewListItem | null = null

	for (const review of reviews) {
		if (!review.completedAt) continue

		if (!latest) {
			latest = review
			continue
		}

		if (
			new Date(review.completedAt).getTime() >
			new Date(latest.completedAt ?? 0).getTime()
		) {
			latest = review
		}
	}

	return latest
}
