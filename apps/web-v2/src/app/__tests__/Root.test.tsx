import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Root } from '../Root'

const auth = vi.hoisted(() => ({
	workOs: {
		isLoading: false,
		signIn: vi.fn<() => Promise<void>>(),
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

vi.mock('@tanstack/react-router', () => ({
	Outlet: () => <p>Route content</p>,
}))

vi.mock('~/components/AppShell', () => ({
	AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('~/components/ui', () => ({
	Button: ({ children, ...props }: ComponentProps<'button'>) => (
		<button {...props}>{children}</button>
	),
	Toaster: () => null,
}))

describe('Root authentication gate', () => {
	beforeEach(() => {
		auth.workOs.isLoading = false
		auth.workOs.user = null
		auth.workOs.signIn.mockReset().mockResolvedValue()
		auth.convex.isAuthenticated = false
		auth.convex.isLoading = false
	})

	it('starts WorkOS sign-in when there is no provider session', async () => {
		render(<Root />)

		expect(screen.getByRole('status')).toBeInTheDocument()
		await waitFor(() => expect(auth.workOs.signIn).toHaveBeenCalledOnce())
	})

	it('shows authentication status while WorkOS is loading', () => {
		auth.workOs.isLoading = true

		render(<Root />)

		expect(screen.getByRole('status')).toBeInTheDocument()
		expect(auth.workOs.signIn).not.toHaveBeenCalled()
	})

	it('shows authentication status while Convex is loading', () => {
		auth.workOs.user = { email: 'test@example.com' }
		auth.convex.isLoading = true

		render(<Root />)

		expect(screen.getByRole('status')).toBeInTheDocument()
		expect(auth.workOs.signIn).not.toHaveBeenCalled()
	})

	it('shows authentication status when WorkOS is authenticated but Convex is not', () => {
		auth.workOs.user = { email: 'test@example.com' }

		render(<Root />)

		expect(screen.getByRole('status')).toBeInTheDocument()
		expect(auth.workOs.signIn).not.toHaveBeenCalled()
	})

	it('retries a failed WorkOS sign-in', async () => {
		const user = userEvent.setup()
		auth.workOs.signIn
			.mockRejectedValueOnce(new Error('Unable to redirect'))
			.mockResolvedValueOnce()

		render(<Root />)

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
			render(<Root />)
			act(() => {
				vi.advanceTimersByTime(5000)
			})

			fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

			expect(auth.workOs.signIn).toHaveBeenCalledOnce()
		} finally {
			vi.useRealTimers()
		}
	})

	it('renders the app only after Convex confirms authentication', () => {
		auth.workOs.user = { email: 'test@example.com' }
		auth.convex.isAuthenticated = true

		render(<Root />)

		expect(screen.getByText('Route content')).toBeInTheDocument()
	})
})
