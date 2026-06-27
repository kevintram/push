import { type ReviewCard } from '../types/review-card.types'

export function hasScheduledDueReviews(reviewCard: ReviewCard): boolean {
	return reviewCard.status_badges.some(
		statusBadge => statusBadge.key === 'due',
	)
}
