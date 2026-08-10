import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ReviewDatePicker } from '../ReviewDatePicker'

vi.mock('~/hooks/useToday', () => ({
	useToday: () => '2026-08-09',
}))

describe('ReviewDatePicker', () => {
	it('disables future dates for a completed review', async () => {
		const user = userEvent.setup()
		render(<ReviewDatePicker isCompleted value='2026-08-09' />)

		await user.click(
			screen.getByRole('button', { name: 'Change review date, Today' }),
		)

		expect(
			screen.getByRole('button', { name: /Sunday, August 9th/ }),
		).toBeEnabled()
		expect(
			screen.getByRole('button', { name: /Monday, August 10th/ }),
		).toBeDisabled()
	})

	it('allows future dates for an incomplete review', async () => {
		const user = userEvent.setup()
		render(<ReviewDatePicker isCompleted={false} value='2026-08-09' />)

		await user.click(
			screen.getByRole('button', { name: 'Change review date, Today' }),
		)

		expect(
			screen.getByRole('button', { name: /Monday, August 10th/ }),
		).toBeEnabled()
	})
})
