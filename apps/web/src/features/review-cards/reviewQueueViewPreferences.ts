import type {
	ReviewFilter,
	ReviewFocusOrder
} from '~/features/review-cards/types/review-card.types'

const REVIEW_QUEUE_VIEW_DEFAULTS = {
	tab: 'due',
	dueScope: 'focused'
} as const satisfies ReviewQueueViewPreference

const REVIEW_VIEW_DEFAULTS = {
	filter: 'all',
	focusOrder: 'due-date'
} as const satisfies ReviewViewPreference

const REVIEW_QUEUE_VIEW_STORAGE_KEYS = {
	practice: '3gulp-practice-view-preferences',
	flashcards: '3gulp-flashcards-view-preferences'
} as const

const REVIEW_VIEW_STORAGE_KEY = '3gulp-review-view-preferences'

export type ReviewQueueViewKind = keyof typeof REVIEW_QUEUE_VIEW_STORAGE_KEYS
export type ReviewQueueViewTab = 'due' | 'new'
export type ReviewQueueDueScope = 'focused' | 'all'

interface ReviewQueueViewPreference {
	tab: ReviewQueueViewTab
	dueScope: ReviewQueueDueScope
}

export interface ReviewViewPreference {
	filter: ReviewFilter
	focusOrder: ReviewFocusOrder
}

function isReviewQueueViewTab(value: unknown): value is ReviewQueueViewTab {
	return value === 'due' || value === 'new'
}

function isReviewQueueDueScope(value: unknown): value is ReviewQueueDueScope {
	return value === 'focused' || value === 'all'
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
	window.localStorage.setItem(key, JSON.stringify(preference))
}

export function getStoredReviewQueueViewPreference(
	kind: ReviewQueueViewKind
): ReviewQueueViewPreference {
	return readStoredPreference(
		REVIEW_QUEUE_VIEW_STORAGE_KEYS[kind],
		REVIEW_QUEUE_VIEW_DEFAULTS,
		parsed => ({
			tab: isReviewQueueViewTab(parsed.tab)
				? parsed.tab
				: REVIEW_QUEUE_VIEW_DEFAULTS.tab,
			dueScope: isReviewQueueDueScope(parsed.dueScope)
				? parsed.dueScope
				: REVIEW_QUEUE_VIEW_DEFAULTS.dueScope
		})
	)
}

export function persistReviewQueueViewPreference(
	kind: ReviewQueueViewKind,
	preference: ReviewQueueViewPreference
) {
	writeStoredPreference(REVIEW_QUEUE_VIEW_STORAGE_KEYS[kind], preference)
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
