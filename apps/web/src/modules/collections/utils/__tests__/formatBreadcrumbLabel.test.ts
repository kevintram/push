import { describe, expect, it } from 'vitest'

import { formatBreadcrumbLabel } from '../formatBreadcrumbLabel'

describe('formatBreadcrumbLabel', () => {
	it.each([
		{ value: 'Verbs', expected: 'Verbs' },
		{ value: '  Verbs  ', expected: 'Verbs' },
		{ value: '', expected: 'Untitled' },
		{ value: '   ', expected: 'Untitled' },
	])('formats "$value" as "$expected"', ({ value, expected }) => {
		expect(formatBreadcrumbLabel(value)).toBe(expected)
	})
})
