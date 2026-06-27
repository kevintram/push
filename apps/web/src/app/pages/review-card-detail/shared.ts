export const EMPTY_BADGE_CLASSNAME =
	'h-5 rounded-sm border-transparent bg-amber-100 text-amber-900 text-xs shadow-sm dark:bg-amber-950 dark:text-amber-200'

export type ReviewCardDetailTab = 'home' | 'reviews'

export function isReviewCardDetailTab(
	value: string,
): value is ReviewCardDetailTab {
	return value === 'home' || value === 'reviews'
}
