import { beforeEach, describe, expect, it } from 'vitest'

import { getCurrentReturnTo, getSafeReturnToUrl } from '../authRedirect'

describe('auth redirects', () => {
	beforeEach(() => {
		window.history.replaceState({}, '', '/')
	})

	it('captures the complete current application URL', () => {
		window.history.replaceState({}, '', '/review/late?mode=compact#card-12')

		expect(getCurrentReturnTo()).toBe('/review/late?mode=compact#card-12')
	})

	it('accepts relative and same-origin return destinations', () => {
		expect(
			getSafeReturnToUrl({ returnTo: '/library/topic-1?tab=new' }),
		).toBe(new URL('/library/topic-1?tab=new', window.location.origin).href)
		expect(
			getSafeReturnToUrl({
				returnTo: `${window.location.origin}/review/due#current`,
			}),
		).toBe(new URL('/review/due#current', window.location.origin).href)
	})

	it.each([
		undefined,
		null,
		{},
		{ returnTo: 42 },
		{ returnTo: 'https://evil.example/review' },
		{ returnTo: '//evil.example/review' },
		{ returnTo: 'javascript:alert(1)' },
		{ returnTo: 'http://[' },
	])('falls back to the root for an unsafe state: %j', state => {
		expect(getSafeReturnToUrl(state)).toBe(
			new URL('/', window.location.origin).href,
		)
	})
})
