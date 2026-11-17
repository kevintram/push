import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ReviewDatePicker } from '../ReviewDatePicker'

vi.mock('~/hooks/useToday', () => ({
	useToday: () => '2026-08-09',
}))

describe('ReviewDatePicker', () => {
	it('disables future dates', async () => {
		const user = userEvent.setup()
		render(<ReviewDatePicker date='2026-08-09' onDateChange={vi.fn()} />)

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

	it('picks a day for an undated draft, and offers no Clear', async () => {
		const user = userEvent.setup()
		const onDateChange = vi.fn()
		render(<ReviewDatePicker date={null} onDateChange={onDateChange} />)

		await user.click(
			screen.getByRole('button', {
				name: 'Change review date, Add completion date',
			}),
		)

		expect(
			screen.queryByRole('button', { name: 'Clear' }),
		).not.toBeInTheDocument()
		await user.click(
			screen.getByRole('button', { name: /Saturday, August 8th/ }),
		)
		expect(onDateChange).toHaveBeenCalledWith('2026-08-08')
	})
})
