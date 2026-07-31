import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthGate } from '../AuthGate'

const auth = vi.hoisted(() => ({
	workOs: {
		isLoading: false,
		signIn: vi.fn<
			(options?: { state?: { returnTo?: string } }) => Promise<void>
		>(),
		user: null as object | null,
	},
	convex: {
		isAuthenticated: false,
		isLoading: false,
	},
}))

vi.mock('@workos-inc/authkit-react', () => ({
	useAuth: () => auth.workOs,
}))

vi.mock('convex/react', () => ({
	useConvexAuth: () => auth.convex,
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
		auth.workOs.isLoading = false
		auth.workOs.user = null
		auth.workOs.signIn.mockReset().mockResolvedValue()
		auth.convex.isAuthenticated = false
		auth.convex.isLoading = false
		window.history.replaceState({}, '', '/')
	})

	it('starts WorkOS sign-in when there is no provider session', async () => {
		window.history.replaceState({}, '', '/review/late?mode=compact#card-12')

		renderAuthGate()

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
		await waitFor(() =>
			expect(auth.workOs.signIn).toHaveBeenCalledWith({
				state: {
					returnTo: '/review/late?mode=compact#card-12',
				},
			}),
		)
	})

	it('shows authentication status while WorkOS is loading', async () => {
		auth.workOs.isLoading = true

		renderAuthGate()

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
		expect(await screen.findByRole('status')).toBeInTheDocument()
		expect(screen.queryByText('Route content')).not.toBeInTheDocument()
		expect(auth.workOs.signIn).not.toHaveBeenCalled()
	})

	it('shows authentication status while Convex is loading', async () => {
		auth.workOs.user = { email: 'test@example.com' }
		auth.convex.isLoading = true

		renderAuthGate()

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
		expect(await screen.findByRole('status')).toBeInTheDocument()
		expect(auth.workOs.signIn).not.toHaveBeenCalled()
	})

	it('shows authentication status when WorkOS is authenticated but Convex is not', async () => {
		auth.workOs.user = { email: 'test@example.com' }

		renderAuthGate()

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
		expect(await screen.findByRole('status')).toBeInTheDocument()
		expect(auth.workOs.signIn).not.toHaveBeenCalled()
	})

	it('retries a failed WorkOS sign-in', async () => {
		const user = userEvent.setup()
		auth.workOs.signIn
			.mockRejectedValueOnce(new Error('Unable to redirect'))
			.mockResolvedValueOnce()

		renderAuthGate()

		expect(
			await screen.findByRole('heading', { name: 'Sign in failed' }),
		).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: 'Retry' }))

		await waitFor(() => expect(auth.workOs.signIn).toHaveBeenCalledTimes(2))
	})

	it('retries sign-in when WorkOS is authenticated but Convex never is', () => {
		vi.useFakeTimers()
		auth.workOs.user = { email: 'test@example.com' }

		try {
			renderAuthGate()
			act(() => {
				vi.advanceTimersByTime(5000)
			})

			fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

			expect(auth.workOs.signIn).toHaveBeenCalledOnce()
		} finally {
			vi.useRealTimers()
		}
	})

	it('renders children only after Convex confirms authentication', () => {
		auth.workOs.user = { email: 'test@example.com' }
		auth.convex.isAuthenticated = true

		renderAuthGate()

		expect(screen.getByText('Route content')).toBeInTheDocument()
	})
})
