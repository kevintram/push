import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth } from '@workos-inc/authkit-react'
import { useConvexAuth, useQuery } from 'convex/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../../../../convex/_generated/api'
import { AccountSettingsSection } from '../AccountSettingsSection'

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

describe('AccountSettingsSection', () => {
	const signIn = vi.fn(async () => {})
	const signOut = vi.fn(async () => {})

	beforeEach(() => {
		vi.clearAllMocks()
		mockedUseAuth.mockReturnValue({
			isLoading: false,
			signIn,
			signOut,
			user: null,
		} as unknown as ReturnType<typeof useAuth>)
		mockedUseConvexAuth.mockReturnValue({
			isAuthenticated: false,
			isLoading: false,
			isRefreshing: false,
		})
		mockedUseQuery.mockReturnValue(undefined)
	})

	it('shows a minimal signed-out state and starts sign-in', async () => {
		const user = userEvent.setup()

		render(<AccountSettingsSection />)

		expect(
			screen.getByText(
				'Sign in to sync your library and review history.',
			),
		).toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent('Signed out')
		expect(mockedUseQuery).toHaveBeenCalledWith(
			api.auth.getIdentity,
			'skip',
		)

		await user.click(screen.getByRole('button', { name: 'Sign in' }))
		expect(signIn).toHaveBeenCalledOnce()
		expect(signOut).not.toHaveBeenCalled()
	})

	it('shows the signed-in identity and ends the session', async () => {
		const user = userEvent.setup()
		mockedUseAuth.mockReturnValue({
			isLoading: false,
			signIn,
			signOut,
			user: {
				email: 'reader@example.com',
				firstName: 'Ada',
				lastName: 'Lovelace',
			},
		} as unknown as ReturnType<typeof useAuth>)
		mockedUseConvexAuth.mockReturnValue({
			isAuthenticated: true,
			isLoading: false,
			isRefreshing: false,
		})
		mockedUseQuery.mockReturnValue({ authenticated: true })

		render(<AccountSettingsSection />)

		expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
		expect(screen.getByText('reader@example.com')).toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent('Connected')
		expect(mockedUseQuery).toHaveBeenCalledWith(api.auth.getIdentity, {})

		await user.click(screen.getByRole('button', { name: 'Sign out' }))
		expect(signOut).toHaveBeenCalledOnce()
		expect(signIn).not.toHaveBeenCalled()
	})

	it('disables the action while the session is loading', () => {
		mockedUseAuth.mockReturnValue({
			isLoading: true,
			signIn,
			signOut,
			user: null,
		} as unknown as ReturnType<typeof useAuth>)

		render(<AccountSettingsSection />)

		expect(screen.getByRole('status')).toHaveTextContent(
			'Checking your session',
		)
		expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()
	})
})
