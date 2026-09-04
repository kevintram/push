import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ReviewDatePicker } from '../ReviewDatePicker'

vi.mock('~/hooks/useToday', () => ({
	useToday: () => '2026-08-09',
}))

describe('ReviewDatePicker', () => {
	it('can hide the visible Unscheduled label while retaining its accessible name', () => {
		render(
			<ReviewDatePicker
				date={null}
				emptyLabel={null}
				kind='scheduled'
				onDateChange={vi.fn()}
			/>,
		)

		const trigger = screen.getByRole('button', {
			name: 'Change review date, Unscheduled',
		})
		expect(trigger).toHaveTextContent(/^$/)
	})

	it('disables future dates for a completed review', async () => {
		const user = userEvent.setup()
		render(
			<ReviewDatePicker
				date='2026-08-09'
				kind='completed'
				onDateChange={vi.fn()}
			/>,
		)

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

	it('allows recovering a completed review with a missing date', async () => {
		const user = userEvent.setup()
		const onDateChange = vi.fn()
		render(
			<ReviewDatePicker
				date={null}
				kind='completed'
				onDateChange={onDateChange}
			/>,
		)

		expect(
			screen.getByRole('button', {
				name: 'Change review date, Add completion date',
			}),
		).toBeInTheDocument()
		await user.click(
			screen.getByRole('button', {
				name: 'Change review date, Add completion date',
			}),
		)

		expect(
			screen.queryByRole('button', { name: 'Clear' }),
		).not.toBeInTheDocument()
		const completionDate = screen.getByRole('button', {
			name: /Sunday, August 9th/,
		})
		await user.click(completionDate)
		expect(onDateChange).toHaveBeenCalledWith('2026-08-09')
	})

	it('allows future dates for an incomplete review', async () => {
		const user = userEvent.setup()
		const onDateChange = vi.fn()
		render(
			<ReviewDatePicker
				date='2026-08-09'
				kind='scheduled'
				onDateChange={onDateChange}
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: 'Change review date, Today' }),
		)

		const futureDate = screen.getByRole('button', {
			name: /Monday, August 10th/,
		})
		expect(futureDate).toBeEnabled()

		await user.click(futureDate)
		expect(onDateChange).toHaveBeenCalledWith('2026-08-10')
	})

	it('only allows clearing the date while the review is incomplete', async () => {
		const user = userEvent.setup()
		const onDateChange = vi.fn()
		const { rerender } = render(
			<ReviewDatePicker
				date='2026-08-09'
				kind='completed'
				onDateChange={vi.fn()}
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: 'Change review date, Today' }),
		)
		expect(
			screen.queryByRole('button', { name: 'Clear' }),
		).not.toBeInTheDocument()

		rerender(
			<ReviewDatePicker
				date='2026-08-09'
				kind='scheduled'
				onDateChange={onDateChange}
			/>,
		)
		const clear = screen.getByRole('button', { name: 'Clear' })
		expect(clear).toBeEnabled()

		await user.click(clear)
		expect(onDateChange).toHaveBeenCalledWith(null)
	})
})
