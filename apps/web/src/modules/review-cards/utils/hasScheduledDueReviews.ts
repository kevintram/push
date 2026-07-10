import { type ReviewCard } from '../types/review-card.types'

export function hasScheduledDueReviews(reviewCard: ReviewCard): boolean {
	return reviewCard.statusBadges.some(
		statusBadge => statusBadge.key === 'due',
	)
}
