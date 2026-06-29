import '@testing-library/jest-dom/vitest'

import { server } from '~/testing/msw/server'

if (typeof Element !== 'undefined' && !('getAnimations' in Element.prototype)) {
	Object.defineProperty(Element.prototype, 'getAnimations', {
		configurable: true,
		value: () => [],
	})
}

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
