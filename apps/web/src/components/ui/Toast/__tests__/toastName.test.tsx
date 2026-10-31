import { describe, expect, it } from 'vitest'

import { toastTitleText } from '~/testing/toastTitleText'

import { toastName } from '../toastTitle'

describe('toastName', () => {
	it('names a blank name by its fallback', () => {
		expect(toastTitleText(toastName(' ', 'Untitled section'))).toBe(
			'**Untitled section**',
		)
	})

	it('cuts a long name to 32 characters, ellipsis included', () => {
		expect(
			toastTitleText(
				toastName('The powerhouse of the cell is the mitochondria'),
			),
		).toBe('**The powerhouse of the cell is t…**')
	})
})
