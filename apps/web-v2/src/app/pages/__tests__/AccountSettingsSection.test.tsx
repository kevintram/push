import { useClerk, useUser } from '@clerk/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AccountSettingsSection } from '../AccountSettingsSection'

vi.mock('@clerk/react', () => ({
	useClerk: vi.fn(),
	useUser: vi.fn(),
}))

const mockedUseClerk = vi.mocked(useClerk)
const mockedUseUser = vi.mocked(useUser)

describe('AccountSettingsSection', () => {
	const signOut = vi.fn(async () => {})

	beforeEach(() => {
		vi.clearAllMocks()
		mockedUseClerk.mockReturnValue({ signOut } as unknown as ReturnType<
			typeof useClerk
		>)
		mockedUseUser.mockReturnValue({
			isLoaded: true,
			isSignedIn: true,
			user: {
				fullName: 'Ada Lovelace',
				primaryEmailAddress: {
					emailAddress: 'reader@example.com',
				},
			},
		} as unknown as ReturnType<typeof useUser>)
	})

	it('shows the Clerk identity and signs out to the application root', async () => {
		const user = userEvent.setup()

		render(<AccountSettingsSection />)

		expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
		expect(screen.getByText('reader@example.com')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Sign out' }))
		expect(signOut).toHaveBeenCalledWith({ redirectUrl: '/' })
	})

	it('shows only the primary email when the account has no name', () => {
		mockedUseUser.mockReturnValue({
			isLoaded: true,
			isSignedIn: true,
			user: {
				fullName: null,
				primaryEmailAddress: {
					emailAddress: 'reader@example.com',
				},
			},
		} as unknown as ReturnType<typeof useUser>)

		render(<AccountSettingsSection />)

		expect(screen.getByText('reader@example.com')).toBeInTheDocument()
		expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
	})

	it('reports a failed sign-out without logging the error payload', async () => {
		const user = userEvent.setup()
		const consoleError = vi
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)
		signOut.mockRejectedValueOnce(new Error('Network down'))

		render(<AccountSettingsSection />)

		await user.click(screen.getByRole('button', { name: 'Sign out' }))

		await vi.waitFor(() =>
			expect(consoleError).toHaveBeenCalledWith(
				'Unable to sign out of Clerk',
			),
		)
		expect(consoleError).not.toHaveBeenCalledWith(
			expect.stringContaining('Network down'),
		)

		consoleError.mockRestore()
	})
})
