import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../AuthProvider'

type AuthKitState = {
	isLoading: boolean
	user: unknown
	getAccessToken: () => Promise<string | null>
}

type AdaptedAuthState = {
	isLoading: boolean
	isAuthenticated: boolean
	fetchAccessToken: () => Promise<string | null>
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
		window.history.replaceState({}, '', '/')
	})

	it('wraps the existing app with AuthKit and then Convex', () => {
		render(
			<AuthProvider>
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

	it('starts reauthentication when token refresh fails', () => {
		window.history.replaceState({}, '', '/review/new?mode=focused#current')
		const signIn = vi.fn(
			async (_options?: { state?: { returnTo?: string } }) => {},
		)

		render(<AuthProvider>Application</AuthProvider>)

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

		render(<AuthProvider>Application</AuthProvider>)

		expect(authState.convex).toMatchObject({
			isLoading: false,
			isAuthenticated: true,
		})
		await expect(authState.convex?.fetchAccessToken()).resolves.toBe(
			'access-token',
		)
		expect(getAccessToken).toHaveBeenCalledOnce()
	})

	it('waits for AuthKit initialization before authenticating Convex', () => {
		authState.authKit = {
			isLoading: true,
			user: { id: 'user_123' },
			getAccessToken: vi.fn(async () => 'access-token'),
		}

		render(<AuthProvider>Application</AuthProvider>)

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

		render(<AuthProvider>Application</AuthProvider>)

		await expect(authState.convex?.fetchAccessToken()).resolves.toBeNull()
		expect(consoleError).toHaveBeenCalledWith(
			'Unable to fetch WorkOS access token',
		)
		expect(consoleError).not.toHaveBeenCalledWith(
			expect.stringContaining('token failure'),
		)
	})
})
