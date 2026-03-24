export const TOPIC_NAVIGATOR_MIN_WIDTH_PX = 12 * 16
export const TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX = 18 * 16
export const TOPIC_NAVIGATOR_MAX_WIDTH_PX = 30 * 16
export const TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY = 'topic-navigator-width'
export const TOPIC_NAVIGATOR_EXPANDED_IDS_STORAGE_KEY =
	'topic-navigator-expanded-ids'
export const TOPIC_NAVIGATOR_DRAG_EXPAND_DELAY_MS = 650
export const TOPIC_NAVIGATOR_DRAG_SCROLL_EDGE_THRESHOLD_PX = 56
export const TOPIC_NAVIGATOR_DRAG_SCROLL_MAX_STEP_PX = 14
export const TOPIC_NAVIGATOR_TREE_INDENT_REM = 0.75

export function areNumberArraysEqual(left: Array<number>, right: Array<number>) {
	if (left.length !== right.length) return false

	for (let index = 0; index < left.length; index += 1) {
		if (left[index] !== right[index]) return false
	}

	return true
}

export function clampTopicNavigatorWidth(width: number) {
	return Math.min(
		Math.max(width, TOPIC_NAVIGATOR_MIN_WIDTH_PX),
		TOPIC_NAVIGATOR_MAX_WIDTH_PX
	)
}

export function getStoredTopicNavigatorWidth() {
	if (typeof window === 'undefined') return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX
	if (typeof window.localStorage?.getItem !== 'function') {
		return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX
	}

	const storedWidth = window.localStorage.getItem(
		TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY
	)

	if (storedWidth == null) return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX

	const parsedWidth = Number.parseFloat(storedWidth)
	if (Number.isNaN(parsedWidth)) return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX

	return clampTopicNavigatorWidth(parsedWidth)
}

export function getStoredExpandedTopicIds() {
	if (typeof window === 'undefined') return []
	if (typeof window.localStorage?.getItem !== 'function') return []

	const storedExpandedIds = window.localStorage.getItem(
		TOPIC_NAVIGATOR_EXPANDED_IDS_STORAGE_KEY
	)

	if (storedExpandedIds == null) return []

	try {
		const parsedValue = JSON.parse(storedExpandedIds)
		if (!Array.isArray(parsedValue)) return []

		return parsedValue.filter(
			(value): value is number =>
				typeof value === 'number' && Number.isInteger(value)
		)
	} catch {
		return []
	}
}
