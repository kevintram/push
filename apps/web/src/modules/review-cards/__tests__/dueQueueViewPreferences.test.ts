import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	getStoredDueViewPreference,
	persistDueViewPreference,
} from '~/modules/review-cards/dueQueueViewPreferences'

const storage = new Map<string, string>()

const mockLocalStorage = {
	getItem: (key: string) => storage.get(key) ?? null,
	setItem: (key: string, value: string) => {
		storage.set(key, value)
	},
	removeItem: (key: string) => {
		storage.delete(key)
	},
	clear: () => {
		storage.clear()
	},
}

describe('due view preferences', () => {
	beforeEach(() => {
		storage.clear()
		vi.stubGlobal('localStorage', mockLocalStorage)
		vi.resetModules()
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('defaults to all filter and due-date focus order', () => {
		expect(getStoredDueViewPreference()).toEqual({
			filter: 'all',
			focusOrder: 'due-date',
		})
	})

	it('persists the due filter and focus order', () => {
		persistDueViewPreference({
			filter: 'flashcards',
			focusOrder: 'random',
		})

		expect(getStoredDueViewPreference()).toEqual({
			filter: 'flashcards',
			focusOrder: 'random',
		})
	})

	it('falls back when stored values are invalid', () => {
		window.localStorage.setItem(
			'3gulp-due-view-preferences',
			JSON.stringify({
				filter: 'invalid',
				focusOrder: 'also-invalid',
			}),
		)

		expect(getStoredDueViewPreference()).toEqual({
			filter: 'all',
			focusOrder: 'due-date',
		})
	})

	it('migrates legacy review-view-preferences key to the due key on first read', async () => {
		window.localStorage.setItem(
			'3gulp-review-view-preferences',
			JSON.stringify({
				filter: 'practice',
				focusOrder: 'random',
			}),
		)

		const { getStoredDueViewPreference: freshGet } = await import(
			'~/modules/review-cards/dueQueueViewPreferences'
		)

		expect(freshGet()).toEqual({
			filter: 'practice',
			focusOrder: 'random',
		})
		expect(window.localStorage.getItem('3gulp-due-view-preferences')).toBe(
			JSON.stringify({ filter: 'practice', focusOrder: 'random' }),
		)
		expect(
			window.localStorage.getItem('3gulp-review-view-preferences'),
		).toBeNull()
	})

	it('does not overwrite an existing due key when migrating', async () => {
		window.localStorage.setItem(
			'3gulp-due-view-preferences',
			JSON.stringify({ filter: 'flashcards', focusOrder: 'due-date' }),
		)
		window.localStorage.setItem(
			'3gulp-review-view-preferences',
			JSON.stringify({ filter: 'practice', focusOrder: 'random' }),
		)

		const { getStoredDueViewPreference: freshGet } = await import(
			'~/modules/review-cards/dueQueueViewPreferences'
		)

		expect(freshGet()).toEqual({
			filter: 'flashcards',
			focusOrder: 'due-date',
		})
		expect(
			window.localStorage.getItem('3gulp-review-view-preferences'),
		).toBeNull()
	})
})
