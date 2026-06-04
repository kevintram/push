import type {
	ReviewFilter,
	ReviewFocusOrder
} from '~/modules/review-cards/types/review-card.types'

const DUE_VIEW_DEFAULTS = {
	filter: 'all',
	focusOrder: 'due-date'
} as const satisfies DueViewPreference

const DUE_VIEW_STORAGE_KEY = '3gulp-due-view-preferences'
const LEGACY_REVIEW_VIEW_STORAGE_KEY = '3gulp-review-view-preferences'

export interface DueViewPreference {
	filter: ReviewFilter
	focusOrder: ReviewFocusOrder
}

export function isReviewFilter(value: unknown): value is ReviewFilter {
	return value === 'all' || value === 'practice' || value === 'flashcards'
}

export function isReviewFocusOrder(value: unknown): value is ReviewFocusOrder {
	return value === 'due-date' || value === 'random'
}

let didMigrateLegacyKey = false

function migrateLegacyDuePreference() {
	if (didMigrateLegacyKey) return
	if (typeof window === 'undefined') return
	if (typeof window.localStorage?.getItem !== 'function') return
	didMigrateLegacyKey = true

	const legacy = window.localStorage.getItem(LEGACY_REVIEW_VIEW_STORAGE_KEY)
	if (legacy === null) return
	if (window.localStorage.getItem(DUE_VIEW_STORAGE_KEY) === null) {
		window.localStorage.setItem(DUE_VIEW_STORAGE_KEY, legacy)
	}
	window.localStorage.removeItem(LEGACY_REVIEW_VIEW_STORAGE_KEY)
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

export function getStoredDueViewPreference(): DueViewPreference {
	migrateLegacyDuePreference()
	return readStoredPreference(
		DUE_VIEW_STORAGE_KEY,
		DUE_VIEW_DEFAULTS,
		parsed => ({
			filter: isReviewFilter(parsed.filter)
				? parsed.filter
				: DUE_VIEW_DEFAULTS.filter,
			focusOrder: isReviewFocusOrder(parsed.focusOrder)
				? parsed.focusOrder
				: DUE_VIEW_DEFAULTS.focusOrder
		})
	)
}

export function persistDueViewPreference(preference: DueViewPreference) {
	migrateLegacyDuePreference()
	writeStoredPreference(DUE_VIEW_STORAGE_KEY, preference)
}
