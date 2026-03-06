const REVIEW_QUEUE_VIEW_DEFAULTS = {
	tab: 'due',
	dueScope: 'focused'
} as const

const REVIEW_QUEUE_VIEW_STORAGE_KEYS = {
	practice: '3gulp-practice-view-preferences',
	flashcards: '3gulp-flashcards-view-preferences'
} as const

export type ReviewQueueViewKind = keyof typeof REVIEW_QUEUE_VIEW_STORAGE_KEYS
export type ReviewQueueViewTab = 'due' | 'new'
export type ReviewQueueDueScope = 'focused' | 'all'

type ReviewQueueViewPreference = {
	tab: ReviewQueueViewTab
	dueScope: ReviewQueueDueScope
}

function isReviewQueueViewTab(value: unknown): value is ReviewQueueViewTab {
	return value === 'due' || value === 'new'
}

function isReviewQueueDueScope(value: unknown): value is ReviewQueueDueScope {
	return value === 'focused' || value === 'all'
}

export function getStoredReviewQueueViewPreference(
	kind: ReviewQueueViewKind
): ReviewQueueViewPreference {
	if (typeof window === 'undefined') {
		return REVIEW_QUEUE_VIEW_DEFAULTS
	}

	const rawValue = window.localStorage.getItem(
		REVIEW_QUEUE_VIEW_STORAGE_KEYS[kind]
	)

	if (rawValue == null) {
		return REVIEW_QUEUE_VIEW_DEFAULTS
	}

	try {
		const parsed = JSON.parse(rawValue) as Partial<ReviewQueueViewPreference>

		return {
			tab: isReviewQueueViewTab(parsed.tab)
				? parsed.tab
				: REVIEW_QUEUE_VIEW_DEFAULTS.tab,
			dueScope: isReviewQueueDueScope(parsed.dueScope)
				? parsed.dueScope
				: REVIEW_QUEUE_VIEW_DEFAULTS.dueScope
		}
	} catch {
		return REVIEW_QUEUE_VIEW_DEFAULTS
	}
}

export function persistReviewQueueViewPreference(
	kind: ReviewQueueViewKind,
	preference: ReviewQueueViewPreference
) {
	if (typeof window === 'undefined') return

	window.localStorage.setItem(
		REVIEW_QUEUE_VIEW_STORAGE_KEYS[kind],
		JSON.stringify(preference)
	)
}
