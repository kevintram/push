import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthGate } from '../AuthGate'

const auth = vi.hoisted(() => ({
	isAuthenticated: false,
	isLoading: false,
	openSignIn: vi.fn(),
}))

vi.mock('@clerk/react', () => ({
	SignInButton: ({
		children,
		mode,
	}: {
		children: ReactNode
		mode: string
	}) => (
		<span data-mode={mode} data-testid='sign-in-button'>
			<span onClick={() => auth.openSignIn()}>{children}</span>
		</span>
	),
}))

vi.mock('convex/react', () => ({
	Authenticated: ({ children }: { children: ReactNode }) =>
		auth.isAuthenticated && !auth.isLoading ? children : null,
	AuthLoading: ({ children }: { children: ReactNode }) =>
		auth.isLoading ? children : null,
	Unauthenticated: ({ children }: { children: ReactNode }) =>
		!auth.isAuthenticated && !auth.isLoading ? children : null,
}))

vi.mock('~/components/ui', () => ({
	Button: ({ children, ...props }: ComponentProps<'button'>) => (
		<button {...props}>{children}</button>
	),
}))

function renderAuthGate() {
	return render(
		<AuthGate>
			<p>Route content</p>
		</AuthGate>,
	)
}

describe('AuthGate', () => {
	beforeEach(() => {
		auth.isAuthenticated = false
		auth.isLoading = false
		auth.openSignIn.mockClear()
	})

	it('offers Clerk modal sign-in when Convex is unauthenticated', async () => {
		const user = userEvent.setup()

		renderAuthGate()

		expect(
			screen.getByRole('heading', { name: 'Sign in to 3gulp' }),
		).toBeInTheDocument()
		expect(screen.getByTestId('sign-in-button')).toHaveAttribute(
			'data-mode',
			'modal',
		)

		await user.click(screen.getByRole('button', { name: 'Sign in' }))
		expect(auth.openSignIn).toHaveBeenCalledOnce()
		expect(screen.queryByText('Route content')).not.toBeInTheDocument()
	})

	it('shows delayed loading UI while Convex validates authentication', async () => {
		auth.isLoading = true

		renderAuthGate()

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
		expect(await screen.findByRole('status')).toBeInTheDocument()
		expect(screen.queryByText('Route content')).not.toBeInTheDocument()
	})

	it('renders protected routes only after Convex authenticates', () => {
		auth.isAuthenticated = true

		renderAuthGate()

		expect(screen.getByText('Route content')).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Sign in' }),
		).not.toBeInTheDocument()
	})
})
