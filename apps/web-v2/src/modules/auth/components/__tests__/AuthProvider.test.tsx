import type { AnyRouter } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../AuthProvider'

type AuthKitState = {
	isLoading: boolean
	user: unknown
	getAccessToken: (options?: {
		forceRefresh?: boolean
	}) => Promise<string | null>
}

type AdaptedAuthState = {
	isLoading: boolean
	isAuthenticated: boolean
	fetchAccessToken: (args: {
		forceRefreshToken: boolean
	}) => Promise<string | null>
}

type RedirectCallback = (args: { state?: unknown }) => void
type RefreshFailureCallback = (args: {
	signIn: (options?: { state?: { returnTo?: string } }) => Promise<void>
}) => void

const testConfig = vi.hoisted(() => ({
	convex: {
		url: 'https://example.convex.cloud',
	},
	workOs: {
		clientId: 'client_example',
		redirectUri: 'https://example.com/',
	},
}))

const authState = vi.hoisted(() => ({
	authKit: undefined as AuthKitState | undefined,
	convex: undefined as AdaptedAuthState | undefined,
	onRedirectCallback: undefined as RedirectCallback | undefined,
	onRefreshFailure: undefined as RefreshFailureCallback | undefined,
}))

const router = vi.hoisted(() => ({
	load: vi.fn(async () => {}),
	navigate: vi.fn(async () => {}),
	state: {
		location: { href: '/' },
	},
}))
const authRouter = router as unknown as AnyRouter

vi.mock('~/lib/config', () => ({
	config: testConfig,
}))

vi.mock('@workos-inc/authkit-react', () => ({
	AuthKitProvider: ({
		children,
		clientId,
		onRedirectCallback,
		onRefreshFailure,
		redirectUri,
	}: {
		children: ReactNode
		clientId: string
		onRedirectCallback?: RedirectCallback
		onRefreshFailure?: RefreshFailureCallback
		redirectUri: string
	}) => {
		authState.onRedirectCallback = onRedirectCallback
		authState.onRefreshFailure = onRefreshFailure

		return (
			<div
				data-client-id={clientId}
				data-redirect-uri={redirectUri}
				data-testid='authkit-provider'
			>
				{children}
			</div>
		)
	},
	useAuth: () => {
		if (!authState.authKit) {
			throw new Error('AuthKit state was not configured for this test')
		}

		return authState.authKit
	},
}))

// The Convex socket and query client are module-scope singletons; stub them so
// importing the provider does not open a real connection.
vi.mock('~/lib/convex', () => ({
	convexClient: {},
	queryClient: {},
}))

vi.mock('convex/react', () => ({
	ConvexProviderWithAuth: ({
		children,
		useAuth,
	}: {
		children: ReactNode
		useAuth: () => AdaptedAuthState
	}) => {
		authState.convex = useAuth()
		return <div data-testid='convex-provider'>{children}</div>
	},
}))

describe('AuthProvider', () => {
	beforeEach(() => {
		authState.authKit = {
			isLoading: true,
			user: null,
			getAccessToken: vi.fn(async () => null),
		}
		authState.convex = undefined
		authState.onRedirectCallback = undefined
		authState.onRefreshFailure = undefined
		router.load.mockClear()
		router.navigate.mockClear()
		router.state.location.href = '/'
	})

	it('wraps the existing app with AuthKit and then Convex', () => {
		render(
			<AuthProvider router={authRouter}>
				<div data-testid='existing-providers'>Application</div>
			</AuthProvider>,
		)

		const authKitProvider = screen.getByTestId('authkit-provider')
		const convexProvider = screen.getByTestId('convex-provider')
		const existingProviders = screen.getByTestId('existing-providers')

		expect(authKitProvider).toContainElement(convexProvider)
		expect(convexProvider).toContainElement(existingProviders)
		expect(authKitProvider).toHaveAttribute(
			'data-client-id',
			testConfig.workOs.clientId,
		)
		expect(authKitProvider).toHaveAttribute(
			'data-redirect-uri',
			testConfig.workOs.redirectUri,
		)
		expect(authState.convex).toMatchObject({
			isLoading: true,
			isAuthenticated: false,
		})
		expect(authState.onRedirectCallback).toBeTypeOf('function')
	})

	it('returns to a safe route through TanStack Router after sign-in', async () => {
		render(<AuthProvider router={authRouter}>Application</AuthProvider>)

		authState.onRedirectCallback?.({
			state: { returnTo: '/library/topic-1?tab=new#notes' },
		})

		await vi.waitFor(() => expect(router.navigate).toHaveBeenCalledOnce())
		expect(router.load).toHaveBeenCalledOnce()
		expect(router.navigate).toHaveBeenCalledWith({
			to: '/library/topic-1?tab=new#notes',
			replace: true,
		})
		expect(router.load.mock.invocationCallOrder[0]).toBeLessThan(
			router.navigate.mock.invocationCallOrder[0] ?? 0,
		)
	})

	it('accepts a same-origin return destination after sign-in', async () => {
		render(<AuthProvider router={authRouter}>Application</AuthProvider>)

		authState.onRedirectCallback?.({
			state: {
				returnTo: `${window.location.origin}/review/due#current`,
			},
		})

		await vi.waitFor(() => expect(router.navigate).toHaveBeenCalledOnce())
		expect(router.navigate).toHaveBeenCalledWith({
			to: '/review/due#current',
			replace: true,
		})
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
	])('falls back to the root for an unsafe state: %j', async state => {
		render(<AuthProvider router={authRouter}>Application</AuthProvider>)

		authState.onRedirectCallback?.({ state })

		await vi.waitFor(() => expect(router.navigate).toHaveBeenCalledOnce())
		expect(router.navigate).toHaveBeenCalledWith({
			to: '/',
			replace: true,
		})
	})

	it('starts reauthentication when token refresh fails', () => {
		router.state.location.href = '/review/new?mode=focused#current'
		const signIn = vi.fn(
			async (_options?: { state?: { returnTo?: string } }) => {},
		)

		render(<AuthProvider router={authRouter}>Application</AuthProvider>)

		authState.onRefreshFailure?.({ signIn })

		expect(signIn).toHaveBeenCalledWith({
			state: { returnTo: '/review/new?mode=focused#current' },
		})
	})

	it('adapts AuthKit authentication state and access tokens for Convex', async () => {
		const getAccessToken = vi.fn(async () => 'access-token')
		authState.authKit = {
			isLoading: false,
			user: { id: 'user_123' },
			getAccessToken,
		}

		render(<AuthProvider router={authRouter}>Application</AuthProvider>)

		expect(authState.convex).toMatchObject({
			isLoading: false,
			isAuthenticated: true,
		})
		await expect(
			authState.convex?.fetchAccessToken({ forceRefreshToken: false }),
		).resolves.toBe('access-token')
		expect(getAccessToken).toHaveBeenCalledWith({ forceRefresh: false })
	})

	it('forces a token refresh when Convex rejects the current token', async () => {
		const getAccessToken = vi.fn(async () => 'refreshed-token')
		authState.authKit = {
			isLoading: false,
			user: { id: 'user_123' },
			getAccessToken,
		}

		render(<AuthProvider router={authRouter}>Application</AuthProvider>)

		await expect(
			authState.convex?.fetchAccessToken({ forceRefreshToken: true }),
		).resolves.toBe('refreshed-token')
		expect(getAccessToken).toHaveBeenCalledWith({ forceRefresh: true })
	})

	it('waits for AuthKit initialization before authenticating Convex', () => {
		authState.authKit = {
			isLoading: true,
			user: { id: 'user_123' },
			getAccessToken: vi.fn(async () => 'access-token'),
		}

		render(<AuthProvider router={authRouter}>Application</AuthProvider>)

		expect(authState.convex).toMatchObject({
			isLoading: true,
			isAuthenticated: false,
		})
	})

	it('returns null without logging token data when token fetching fails', async () => {
		const getAccessToken = vi.fn(async () => {
			throw new Error('token failure')
		})
		const consoleError = vi
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)
		authState.authKit = {
			isLoading: false,
			user: { id: 'user_123' },
			getAccessToken,
		}

		render(<AuthProvider router={authRouter}>Application</AuthProvider>)

		await expect(
			authState.convex?.fetchAccessToken({ forceRefreshToken: false }),
		).resolves.toBeNull()
		expect(consoleError).toHaveBeenCalledWith(
			'Unable to fetch WorkOS access token',
		)
		expect(consoleError).not.toHaveBeenCalledWith(
			expect.stringContaining('token failure'),
		)
	})
})
