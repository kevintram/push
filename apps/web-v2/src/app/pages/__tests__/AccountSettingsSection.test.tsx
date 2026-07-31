import { api } from '@convex/_generated/api'
import { convexQuery } from '@convex-dev/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth } from '@workos-inc/authkit-react'
import { useConvexAuth } from 'convex/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '~/testing/createTestQueryClient'

import { AccountSettingsSection } from '../AccountSettingsSection'

vi.mock('@workos-inc/authkit-react', () => ({
	useAuth: vi.fn(),
}))

// Only the auth hook is stubbed. The rest of `convex/react` stays real so that
// `@convex-dev/react-query` can still import from it.
vi.mock('convex/react', async importOriginal => ({
	...(await importOriginal<typeof import('convex/react')>()),
	useConvexAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseConvexAuth = vi.mocked(useConvexAuth)

const identityQuery = convexQuery(api.auth.verifyIdentity, {})

// The test query client has no working default queryFn, so any read the
// component makes that was not seeded here fails loudly instead of reaching
// for a Convex socket.
function renderWithQueryClient(ui: ReactElement) {
	const queryClient = createTestQueryClient()
	queryClient.setQueryData(identityQuery.queryKey, { authenticated: true })

	return render(
		<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
	)
}

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
	})

	it('shows a minimal signed-out state and starts sign-in', async () => {
		const user = userEvent.setup()

		renderWithQueryClient(<AccountSettingsSection />)

		expect(
			screen.getByText(
				'Sign in to sync your library and review history.',
			),
		).toBeInTheDocument()
		// Identity data is cached, but the signed-out read is skipped, so the
		// component must not report a verified session.
		expect(screen.getByRole('status')).toHaveTextContent('Signed out')

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

		renderWithQueryClient(<AccountSettingsSection />)

		expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
		expect(screen.getByText('reader@example.com')).toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent('Connected')

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

		renderWithQueryClient(<AccountSettingsSection />)

		expect(screen.getByRole('status')).toHaveTextContent(
			'Checking your session',
		)
		expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()
	})
})
