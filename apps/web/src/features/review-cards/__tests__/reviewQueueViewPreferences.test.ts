import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	getStoredReviewViewPreference,
	persistReviewViewPreference
} from '~/features/review-cards/reviewQueueViewPreferences'

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
	}
}

describe('review view preferences', () => {
	beforeEach(() => {
		storage.clear()
		vi.stubGlobal('localStorage', mockLocalStorage)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('defaults to all filter and due-date focus order', () => {
		expect(getStoredReviewViewPreference()).toEqual({
			filter: 'all',
			focusOrder: 'due-date'
		})
	})

	it('persists the review filter and focus order', () => {
		persistReviewViewPreference({
			filter: 'flashcards',
			focusOrder: 'random'
		})

		expect(getStoredReviewViewPreference()).toEqual({
			filter: 'flashcards',
			focusOrder: 'random'
		})
	})

	it('falls back when stored values are invalid', () => {
		window.localStorage.setItem(
			'3gulp-review-view-preferences',
			JSON.stringify({
				filter: 'invalid',
				focusOrder: 'also-invalid'
			})
		)

		expect(getStoredReviewViewPreference()).toEqual({
			filter: 'all',
			focusOrder: 'due-date'
		})
	})
})
