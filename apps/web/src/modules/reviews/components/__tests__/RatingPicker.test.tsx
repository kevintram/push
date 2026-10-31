import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RatingPicker } from '../RatingPicker'

describe('RatingPicker', () => {
	it('closes the menu after picking a rating', async () => {
		const user = userEvent.setup()
		const onSetRating = vi.fn()
		render(<RatingPicker onSetRating={onSetRating} rating={undefined} />)

		await user.click(screen.getByRole('button', { name: 'Uncompleted' }))
		await user.click(screen.getByRole('menuitemradio', { name: 'Good' }))

		expect(onSetRating).toHaveBeenCalledWith('good')
		expect(screen.queryAllByRole('menuitemradio')).toHaveLength(0)
	})

	it('closes the menu after clearing the rating', async () => {
		const user = userEvent.setup()
		const onSetRating = vi.fn()
		render(<RatingPicker onSetRating={onSetRating} rating='good' />)

		await user.click(screen.getByRole('button', { name: 'Good' }))
		await user.click(
			screen.getByRole('menuitemradio', { name: 'Uncompleted' }),
		)

		expect(onSetRating).toHaveBeenCalledWith(null)
		expect(screen.queryAllByRole('menuitemradio')).toHaveLength(0)
	})

	it('picks a rating with its key while the menu is open, and closes it', async () => {
		const user = userEvent.setup()
		const onSetRating = vi.fn()
		render(<RatingPicker onSetRating={onSetRating} rating='good' />)

		// Opened from the keyboard, focus lands on an item, not the menu.
		screen.getByRole('button', { name: 'Good' }).focus()
		await user.keyboard('{Enter}')
		await screen.findByRole('menu')
		await user.keyboard('2')
		expect(onSetRating).toHaveBeenCalledWith('hard')
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Good' }))
		await user.keyboard('0')
		expect(onSetRating).toHaveBeenLastCalledWith(null)
	})

	it('leaves the rating keys alone while the menu is closed', async () => {
		const user = userEvent.setup()
		const onSetRating = vi.fn()
		render(<RatingPicker onSetRating={onSetRating} rating={undefined} />)

		screen.getByRole('button', { name: 'Uncompleted' }).focus()
		await user.keyboard('3')
		expect(onSetRating).not.toHaveBeenCalled()
	})
})
