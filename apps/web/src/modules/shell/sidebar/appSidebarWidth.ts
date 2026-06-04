import {
	TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX,
	TOPIC_NAVIGATOR_MAX_WIDTH_PX,
	TOPIC_NAVIGATOR_MIN_WIDTH_PX
} from '~/modules/topics/components/topic-navigator/TopicNavigator.shared'

export const APP_SIDEBAR_WIDTH_STORAGE_KEY = 'app-sidebar-width'

export function clampAppSidebarWidth(width: number) {
	return Math.min(
		Math.max(width, TOPIC_NAVIGATOR_MIN_WIDTH_PX),
		TOPIC_NAVIGATOR_MAX_WIDTH_PX
	)
}

export function getStoredAppSidebarWidth() {
	if (typeof window === 'undefined') return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX
	if (typeof window.localStorage?.getItem !== 'function') {
		return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX
	}

	const storedWidth = window.localStorage.getItem(APP_SIDEBAR_WIDTH_STORAGE_KEY)

	if (storedWidth == null) return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX

	const parsedWidth = Number.parseFloat(storedWidth)
	if (Number.isNaN(parsedWidth)) return TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX

	return clampAppSidebarWidth(parsedWidth)
}
