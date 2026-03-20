import { localDateString } from '~/utils/date'
import type { ReviewListItem } from '../types/review.types'

export function splitReviews(reviews: Array<ReviewListItem>) {
	const today = localDateString()
	const uncompletedUnscheduled: Array<ReviewListItem> = []
	const overdue: Array<ReviewListItem> = []
	const todayReviews: Array<ReviewListItem> = []
	const upcoming: Array<ReviewListItem> = []
	const completed: Array<ReviewListItem> = []

	for (const review of reviews) {
		if (review.completed_at) {
			completed.push(review)
			continue
		}

		if (review.scheduled_at || review.effective_date) {
			const date = review.effective_date ?? review.scheduled_at
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
		new Date(a.effective_date ?? 0).getTime() -
		new Date(b.effective_date ?? 0).getTime()

	overdue.sort(sortByEffectiveDateAsc)
	todayReviews.sort(sortByEffectiveDateAsc)
	upcoming.sort(sortByEffectiveDateAsc)
	uncompletedUnscheduled.sort((a, b) => {
		return new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
	})
	completed.sort((a, b) => {
		return (
			new Date(b.completed_at ?? b.effective_date ?? 0).getTime() -
			new Date(a.completed_at ?? a.effective_date ?? 0).getTime()
		)
	})

	return {
		uncompletedUnscheduledReviews: uncompletedUnscheduled,
		overdueReviews: overdue,
		todayReviews,
		upcomingReviews: upcoming,
		completedReviews: completed
	}
}

export function getLatestCompletedReview(reviews: Array<ReviewListItem>) {
	let latest: ReviewListItem | null = null

	for (const review of reviews) {
		if (!review.completed_at) continue

		if (!latest) {
			latest = review
			continue
		}

		if (
			new Date(review.completed_at).getTime() >
			new Date(latest.completed_at ?? 0).getTime()
		) {
			latest = review
		}
	}

	return latest
}
