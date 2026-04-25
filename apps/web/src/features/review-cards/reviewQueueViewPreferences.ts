import type {
	ReviewFilter,
	ReviewFocusOrder
} from '~/features/review-cards/types/review-card.types'

const REVIEW_VIEW_DEFAULTS = {
	filter: 'all',
	focusOrder: 'due-date'
} as const satisfies ReviewViewPreference

const REVIEW_VIEW_STORAGE_KEY = '3gulp-review-view-preferences'

export interface ReviewViewPreference {
	filter: ReviewFilter
	focusOrder: ReviewFocusOrder
}

export function isReviewFilter(value: unknown): value is ReviewFilter {
	return value === 'all' || value === 'practice' || value === 'flashcards'
}

export function isReviewFocusOrder(value: unknown): value is ReviewFocusOrder {
	return value === 'due-date' || value === 'random'
}

function readStoredPreference<T>(
	key: string,
	defaults: T,
	coerce: (parsed: Partial<T>) => T
): T {
	if (typeof window === 'undefined') return defaults
	if (typeof window.localStorage?.getItem !== 'function') return defaults

	const rawValue = window.localStorage.getItem(key)
	if (rawValue === null) return defaults

	try {
		return coerce(JSON.parse(rawValue) as Partial<T>)
	} catch {
		return defaults
	}
}

function writeStoredPreference<T>(key: string, preference: T) {
	if (typeof window === 'undefined') return
	if (typeof window.localStorage?.setItem !== 'function') return
	const next = JSON.stringify(preference)
	if (window.localStorage.getItem(key) === next) return
	window.localStorage.setItem(key, next)
}

export function getStoredReviewViewPreference(): ReviewViewPreference {
	return readStoredPreference(
		REVIEW_VIEW_STORAGE_KEY,
		REVIEW_VIEW_DEFAULTS,
		parsed => ({
			filter: isReviewFilter(parsed.filter)
				? parsed.filter
				: REVIEW_VIEW_DEFAULTS.filter,
			focusOrder: isReviewFocusOrder(parsed.focusOrder)
				? parsed.focusOrder
				: REVIEW_VIEW_DEFAULTS.focusOrder
		})
	)
}

export function persistReviewViewPreference(preference: ReviewViewPreference) {
	writeStoredPreference(REVIEW_VIEW_STORAGE_KEY, preference)
}
