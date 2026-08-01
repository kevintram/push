import { render } from '@testing-library/react'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthedRouterProvider } from '../AuthedRouterProvider'

const auth = vi.hoisted(() => ({
	isAuthenticated: false,
	isLoading: true,
}))

const router = vi.hoisted(() => ({
	invalidate: vi.fn(async () => {}),
}))

const renderedContext = vi.hoisted(() => ({
	auth: undefined as
		| { isAuthenticated: boolean; isLoading: boolean }
		| undefined,
}))

vi.mock('convex/react', () => ({
	useConvexAuth: () => auth,
}))

vi.mock('../router', () => ({ router }))

vi.mock('@tanstack/react-router', () => ({
	RouterProvider: ({
		context,
	}: {
		context: {
			auth: { isAuthenticated: boolean; isLoading: boolean }
		}
	}) => {
		renderedContext.auth = context.auth
		return null
	},
}))

describe('AuthedRouterProvider', () => {
	beforeEach(() => {
		auth.isAuthenticated = false
		auth.isLoading = true
		renderedContext.auth = undefined
		router.invalidate.mockClear()
	})

	it('injects Convex authentication into router context', () => {
		render(<AuthedRouterProvider />)

		expect(renderedContext.auth).toEqual({
			isAuthenticated: false,
			isLoading: true,
		})
		expect(router.invalidate).not.toHaveBeenCalled()
	})

	it('invalidates active routes when Convex authentication changes', () => {
		const view = render(<AuthedRouterProvider />)

		act(() => {
			auth.isAuthenticated = true
			auth.isLoading = false
			view.rerender(<AuthedRouterProvider />)
		})

		expect(renderedContext.auth).toEqual({
			isAuthenticated: true,
			isLoading: false,
		})
		expect(router.invalidate).toHaveBeenCalledOnce()
	})
})
