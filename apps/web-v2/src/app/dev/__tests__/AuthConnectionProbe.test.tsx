import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth } from '@workos-inc/authkit-react'
import { useConvexAuth, useQuery } from 'convex/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../../../../convex/_generated/api'
import { AuthConnectionProbe } from '../AuthConnectionProbe'

vi.mock('@workos-inc/authkit-react', () => ({
	useAuth: vi.fn(),
}))

vi.mock('convex/react', () => ({
	useConvexAuth: vi.fn(),
	useQuery: vi.fn(),
}))

vi.mock('../../../../convex/_generated/api', () => ({
	api: {
		auth: {
			getIdentity: 'auth:getIdentity',
		},
	},
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseConvexAuth = vi.mocked(useConvexAuth)
const mockedUseQuery = vi.mocked(useQuery)

describe('AuthConnectionProbe', () => {
	const signIn = vi.fn(async () => {})
	const signOut = vi.fn(async () => {})

	beforeEach(() => {
		mockedUseAuth.mockReturnValue({
			signIn,
			signOut,
		} as unknown as ReturnType<typeof useAuth>)
		mockedUseConvexAuth.mockReturnValue({
			isAuthenticated: false,
			isLoading: false,
			isRefreshing: false,
		})
		mockedUseQuery.mockReturnValue(undefined)
	})

	it('shows the initial Convex loading state', () => {
		mockedUseConvexAuth.mockReturnValue({
			isAuthenticated: false,
			isLoading: true,
			isRefreshing: false,
		})

		render(<AuthConnectionProbe />)

		expect(screen.getByRole('status')).toHaveTextContent('Checking session')
		expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()
		expect(mockedUseQuery).toHaveBeenCalledWith(
			api.auth.getIdentity,
			'skip',
		)
	})

	it('starts AuthKit sign-in while leaving the protected query skipped', async () => {
		const user = userEvent.setup()

		render(<AuthConnectionProbe />)
		await user.click(screen.getByRole('button', { name: 'Sign in' }))

		expect(screen.getByRole('status')).toHaveTextContent('Not signed in')
		expect(signIn).toHaveBeenCalledOnce()
		expect(signOut).not.toHaveBeenCalled()
		expect(mockedUseQuery).toHaveBeenCalledWith(
			api.auth.getIdentity,
			'skip',
		)
	})

	it('verifies the authenticated session with the protected Convex query', async () => {
		const user = userEvent.setup()
		mockedUseConvexAuth.mockReturnValue({
			isAuthenticated: true,
			isLoading: false,
			isRefreshing: false,
		})
		mockedUseQuery.mockReturnValue({ authenticated: true })

		render(<AuthConnectionProbe />)
		await user.click(screen.getByRole('button', { name: 'Sign out' }))

		expect(screen.getByRole('status')).toHaveTextContent(
			'Verified by Convex',
		)
		expect(mockedUseQuery).toHaveBeenCalledWith(api.auth.getIdentity, {})
		expect(signOut).toHaveBeenCalledOnce()
		expect(signIn).not.toHaveBeenCalled()
	})

	it('shows token refresh without exposing the protected query result', () => {
		mockedUseConvexAuth.mockReturnValue({
			isAuthenticated: true,
			isLoading: false,
			isRefreshing: true,
		})

		render(<AuthConnectionProbe />)

		expect(screen.getByRole('status')).toHaveTextContent(
			'Refreshing session',
		)
		expect(mockedUseQuery).toHaveBeenCalledWith(api.auth.getIdentity, {})
	})
})
