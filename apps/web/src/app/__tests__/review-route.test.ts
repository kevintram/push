import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	resolveReviewFilter,
	validateReviewSearch
} from '~/app/routes/_main/review'
import { createMockLocalStorage } from '~/testing/support/masonryPageTestSupport'

const mockLocalStorage = createMockLocalStorage()

describe('review route search', () => {
	beforeEach(() => {
		mockLocalStorage.clear()
		vi.stubGlobal('localStorage', mockLocalStorage)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('accepts supported filter values', () => {
		expect(validateReviewSearch({ filter: 'all' })).toEqual({ filter: 'all' })
		expect(validateReviewSearch({ filter: 'practice' })).toEqual({
			filter: 'practice'
		})
		expect(validateReviewSearch({ filter: 'flashcards' })).toEqual({
			filter: 'flashcards'
		})
	})

	it('falls back to stored filter when the URL filter is missing or invalid', () => {
		globalThis.localStorage.setItem(
			'3gulp-review-view-preferences',
			JSON.stringify({
				filter: 'flashcards',
				focusOrder: 'random'
			})
		)

		expect(validateReviewSearch({ filter: 'wat' })).toEqual({
			filter: undefined
		})
		expect(resolveReviewFilter(validateReviewSearch({ filter: 'wat' }))).toBe(
			'flashcards'
		)
		expect(resolveReviewFilter(validateReviewSearch({}))).toBe('flashcards')
	})
})
