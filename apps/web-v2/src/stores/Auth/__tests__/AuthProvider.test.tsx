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

type RedirectCallback = () => void

const authState = vi.hoisted(() => ({
	authKit: undefined as AuthKitState | undefined,
	convex: undefined as AdaptedAuthState | undefined,
	onRedirectCallback: undefined as RedirectCallback | undefined,
}))

vi.mock('@workos-inc/authkit-react', () => ({
	AuthKitProvider: ({
		children,
		clientId,
		onRedirectCallback,
		redirectUri,
	}: {
		children: ReactNode
		clientId: string
		onRedirectCallback?: RedirectCallback
		redirectUri: string
	}) => {
		authState.onRedirectCallback = onRedirectCallback

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

vi.mock('convex/react', () => ({
	ConvexReactClient: class ConvexReactClient {},
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
	})

	it('wraps the existing app with AuthKit and then Convex', () => {
		const onRedirectCallback = vi.fn()

		render(
			<AuthProvider onRedirectCallback={onRedirectCallback}>
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
			import.meta.env.VITE_WORKOS_CLIENT_ID,
		)
		expect(authKitProvider).toHaveAttribute(
			'data-redirect-uri',
			import.meta.env.VITE_WORKOS_REDIRECT_URI,
		)
		expect(authState.convex).toMatchObject({
			isLoading: true,
			isAuthenticated: false,
		})
		expect(authState.onRedirectCallback).toBe(onRedirectCallback)
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
