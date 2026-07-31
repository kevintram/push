import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth } from '@workos-inc/authkit-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AccountSettingsSection } from '../AccountSettingsSection'

vi.mock('@workos-inc/authkit-react', () => ({
	useAuth: vi.fn(),
}))

// `config` reads `import.meta.env`, which Vite does not populate from
// `.env.local` in test mode.
vi.mock('~/lib/config', () => ({
	config: {
		workOs: { signOutReturnTo: 'https://signed-out.example.com' },
	},
}))

const mockedUseAuth = vi.mocked(useAuth)

describe('AccountSettingsSection', () => {
	const signOut = vi.fn(async () => {})

	beforeEach(() => {
		vi.clearAllMocks()
		mockedUseAuth.mockReturnValue({
			isLoading: false,
			signOut,
			user: {
				email: 'reader@example.com',
				firstName: 'Ada',
				lastName: 'Lovelace',
			},
		} as unknown as ReturnType<typeof useAuth>)
	})

	it('shows the signed-in identity and signs out to the configured return URL', async () => {
		const user = userEvent.setup()

		render(<AccountSettingsSection />)

		expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
		expect(screen.getByText('reader@example.com')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Sign out' }))
		expect(signOut).toHaveBeenCalledWith({
			returnTo: 'https://signed-out.example.com',
		})
	})

	it('shows only the email when the account has no name', () => {
		mockedUseAuth.mockReturnValue({
			isLoading: false,
			signOut,
			user: {
				email: 'reader@example.com',
				firstName: null,
				lastName: null,
			},
		} as unknown as ReturnType<typeof useAuth>)

		render(<AccountSettingsSection />)

		expect(screen.getByText('reader@example.com')).toBeInTheDocument()
		expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
	})

	it('reports a failed sign-out instead of leaving a rejection unhandled', async () => {
		const user = userEvent.setup()
		const consoleError = vi
			.spyOn(console, 'error')
			.mockImplementation(() => {})
		signOut.mockRejectedValueOnce(new Error('Network down'))

		render(<AccountSettingsSection />)

		await user.click(screen.getByRole('button', { name: 'Sign out' }))

		await vi.waitFor(() =>
			expect(consoleError).toHaveBeenCalledWith(
				'Unable to sign out of WorkOS',
			),
		)

		consoleError.mockRestore()
	})
})
