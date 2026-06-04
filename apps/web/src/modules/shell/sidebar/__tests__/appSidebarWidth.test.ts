import { beforeEach, describe, expect, it } from 'vitest'
import {
	APP_SIDEBAR_WIDTH_STORAGE_KEY,
	clampAppSidebarWidth,
	getStoredAppSidebarWidth
} from '~/modules/shell/sidebar/appSidebarWidth'
import {
	TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX,
	TOPIC_NAVIGATOR_MAX_WIDTH_PX,
	TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY
} from '~/modules/topics/components/topic-navigator/TopicNavigator.shared'

describe('appSidebarWidth', () => {
	beforeEach(() => {
		const storage = new Map<string, string>()
		Object.defineProperty(window, 'localStorage', {
			configurable: true,
			value: {
				getItem: (key: string) => storage.get(key) ?? null,
				setItem: (key: string, value: string) => {
					storage.set(key, value)
				},
				removeItem: (key: string) => {
					storage.delete(key)
				}
			}
		})
	})

	it('returns the stored app sidebar width', () => {
		window.localStorage.setItem(APP_SIDEBAR_WIDTH_STORAGE_KEY, '320')

		expect(getStoredAppSidebarWidth()).toBe(clampAppSidebarWidth(320))
	})

	it('ignores legacy topic navigator width storage', () => {
		window.localStorage.setItem(TOPIC_NAVIGATOR_WIDTH_STORAGE_KEY, '320')

		expect(getStoredAppSidebarWidth()).toBe(TOPIC_NAVIGATOR_DEFAULT_WIDTH_PX)
	})

	it('clamps oversized stored values', () => {
		window.localStorage.setItem(
			APP_SIDEBAR_WIDTH_STORAGE_KEY,
			String(TOPIC_NAVIGATOR_MAX_WIDTH_PX + 100)
		)

		expect(getStoredAppSidebarWidth()).toBe(TOPIC_NAVIGATOR_MAX_WIDTH_PX)
	})
})
