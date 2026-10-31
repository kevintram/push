import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../AuthProvider'

const providerState = vi.hoisted(() => ({
	clerkUseAuth: vi.fn(),
	convexUseAuth: undefined as unknown,
}))

const testConfig = vi.hoisted(() => ({
	clerk: {
		publishableKey: 'pk_test_example',
	},
	convex: {
		url: 'https://example.convex.cloud',
	},
}))

vi.mock('~/lib/config', () => ({ config: testConfig }))

vi.mock('~/lib/convex', () => ({
	convexClient: {},
	queryClient: {},
}))

vi.mock('@clerk/react', () => ({
	ClerkProvider: ({
		afterSignOutUrl,
		children,
		publishableKey,
	}: {
		afterSignOutUrl: string
		children: ReactNode
		publishableKey: string
	}) => (
		<div
			data-after-sign-out-url={afterSignOutUrl}
			data-publishable-key={publishableKey}
			data-testid='clerk-provider'
		>
			{children}
		</div>
	),
	useAuth: providerState.clerkUseAuth,
}))

vi.mock('convex/react-clerk', () => ({
	ConvexProviderWithClerk: ({
		children,
		useAuth,
	}: {
		children: ReactNode
		useAuth: unknown
	}) => {
		providerState.convexUseAuth = useAuth

		return <div data-testid='convex-provider'>{children}</div>
	},
}))

describe('AuthProvider', () => {
	it('wraps the app with Clerk and Clerk-authenticated Convex', () => {
		render(
			<AuthProvider>
				<div data-testid='application'>Application</div>
			</AuthProvider>,
		)

		const clerkProvider = screen.getByTestId('clerk-provider')
		const convexProvider = screen.getByTestId('convex-provider')

		expect(clerkProvider).toContainElement(convexProvider)
		expect(convexProvider).toContainElement(
			screen.getByTestId('application'),
		)
		expect(clerkProvider).toHaveAttribute(
			'data-publishable-key',
			testConfig.clerk.publishableKey,
		)
		expect(clerkProvider).toHaveAttribute('data-after-sign-out-url', '/')
		expect(providerState.convexUseAuth).toBe(providerState.clerkUseAuth)
	})
})
