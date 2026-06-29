import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	resolveDueFilter,
	validateDueFocusSearch,
	validateDueSearch,
} from '~/app/routes/due'
import { createMockLocalStorage } from '~/testing/support/masonryPageTestSupport'

const mockLocalStorage = createMockLocalStorage()

describe('due route search', () => {
	beforeEach(() => {
		mockLocalStorage.clear()
		vi.stubGlobal('localStorage', mockLocalStorage)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('accepts supported filter values', () => {
		expect(validateDueSearch({ filter: 'all' })).toEqual({ filter: 'all' })
		expect(validateDueSearch({ filter: 'practice' })).toEqual({
			filter: 'practice',
		})
		expect(validateDueSearch({ filter: 'flashcards' })).toEqual({
			filter: 'flashcards',
		})
	})

	it('falls back to stored filter when the URL filter is missing or invalid', () => {
		globalThis.localStorage.setItem(
			'3gulp-due-view-preferences',
			JSON.stringify({
				filter: 'flashcards',
				focusOrder: 'random',
			}),
		)

		expect(validateDueSearch({ filter: 'wat' })).toEqual({
			filter: undefined,
		})
		expect(resolveDueFilter(validateDueSearch({ filter: 'wat' }))).toBe(
			'flashcards',
		)
		expect(resolveDueFilter(validateDueSearch({}))).toBe('flashcards')
	})

	it('accepts focus index state search params', () => {
		expect(
			validateDueFocusSearch({
				card: '12',
				done: 'true',
				filter: 'all',
				include_future: 'true',
				order: 'random',
				shuffle: 'seed',
			}),
		).toEqual({
			card: 12,
			done: true,
			filter: 'all',
			include_future: true,
			order: 'random',
			shuffle: 'seed',
		})
	})
})
