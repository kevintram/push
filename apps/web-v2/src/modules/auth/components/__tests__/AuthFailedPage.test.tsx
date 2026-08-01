import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AuthFailedPage } from '../AuthFailedPage'

describe('AuthFailedPage', () => {
	it('explains the failure and lets the user retry', async () => {
		const user = userEvent.setup()
		const onRetry = vi.fn()

		render(<AuthFailedPage onRetry={onRetry} />)

		expect(
			screen.getByRole('heading', { name: 'Sign in failed' }),
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Retry' }))

		expect(onRetry).toHaveBeenCalledOnce()
	})
})
