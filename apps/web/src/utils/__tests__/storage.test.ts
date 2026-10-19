import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	readStoredBoolean,
	readStoredStringArray,
	readStoredValue,
	writeStoredBoolean,
	writeStoredValue,
} from '../storage'

const KEY = 'storageTest'
const MODES = ['on', 'off'] as const

describe('storage', () => {
	beforeEach(() => {
		window.localStorage.clear()
		window.sessionStorage.clear()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('reads an allowed stored value', () => {
		window.localStorage.setItem(KEY, 'on')
		expect(readStoredValue(KEY, MODES, 'off')).toBe('on')
	})

	it('falls back for missing or unrecognized values', () => {
		expect(readStoredValue(KEY, MODES, 'off')).toBe('off')
		window.localStorage.setItem(KEY, 'maybe')
		expect(readStoredValue(KEY, MODES, 'off')).toBe('off')
	})

	it('keeps local and session storage separate', () => {
		writeStoredValue(KEY, 'on', 'session')
		expect(window.sessionStorage.getItem(KEY)).toBe('on')
		expect(window.localStorage.getItem(KEY)).toBeNull()
		expect(readStoredValue(KEY, MODES, 'off', 'session')).toBe('on')
		expect(readStoredValue(KEY, MODES, 'off')).toBe('off')
	})

	it.each([true, false])('round-trips the boolean %s', value => {
		writeStoredBoolean(KEY, value)
		expect(window.localStorage.getItem(KEY)).toBe(String(value))
		expect(readStoredBoolean(KEY, !value)).toBe(value)
	})

	it.each([true, false])(
		'falls back to %s for an invalid boolean',
		fallback => {
			window.localStorage.setItem(KEY, 'invalid')
			expect(readStoredBoolean(KEY, fallback)).toBe(fallback)
		},
	)

	it('reads a stored string array', () => {
		window.localStorage.setItem(KEY, '["a","b"]')
		expect(readStoredStringArray(KEY)).toEqual(['a', 'b'])
	})

	it.each(['not json', '"a"', '{"a":1}', '["a",1]'])(
		'falls back to an empty array for %s',
		value => {
			window.localStorage.setItem(KEY, value)
			expect(readStoredStringArray(KEY)).toEqual([])
		},
	)

	it('tolerates unavailable storage', () => {
		vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
			throw new Error('Storage unavailable')
		})
		vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
			throw new Error('Storage unavailable')
		})
		expect(readStoredBoolean(KEY, true)).toBe(true)
		expect(() => writeStoredBoolean(KEY, false)).not.toThrow()
		expect(readStoredStringArray(KEY)).toEqual([])
	})
})
