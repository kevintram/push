import { type ReviewCardStatusBadge } from '../types/status-badge.types'

export function orderReviewCardStatusBadges(
	badges: Array<ReviewCardStatusBadge>,
): Array<ReviewCardStatusBadge> {
	if (badges.length <= 1) return badges

	const leadingBadges: Array<ReviewCardStatusBadge> = []
	const hazyBadges: Array<ReviewCardStatusBadge> = []
	const forgottenBadges: Array<ReviewCardStatusBadge> = []
	const dueBadges: Array<ReviewCardStatusBadge> = []

	for (const badge of badges) {
		if (badge.key === 'due') {
			dueBadges.push(badge)
			continue
		}
		if (badge.key === 'hazy_soon' || badge.key === 'hazy_for') {
			hazyBadges.push(badge)
			continue
		}
		if (badge.key === 'forgotten_soon' || badge.key === 'forgotten_for') {
			forgottenBadges.push(badge)
			continue
		}
		leadingBadges.push(badge)
	}

	if (dueBadges.length === 0 && forgottenBadges.length === 0) {
		return badges
	}

	return [...leadingBadges, ...hazyBadges, ...forgottenBadges, ...dueBadges]
}
