import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RatingPicker } from '../RatingPicker'

describe('RatingPicker', () => {
	it('lists the ratings', async () => {
		const user = userEvent.setup()
		render(<RatingPicker onSetRating={vi.fn()} rating={undefined} />)

		await user.click(screen.getByRole('button', { name: 'Rate' }))
		expect(
			screen.getAllByRole('menuitemradio').map(item => item.textContent),
		).toEqual(['Miss1', 'Hard2', 'Good3', 'Easy4'])
	})

	it('closes the menu after picking a rating', async () => {
		const user = userEvent.setup()
		const onSetRating = vi.fn()
		render(<RatingPicker onSetRating={onSetRating} rating={undefined} />)

		await user.click(screen.getByRole('button', { name: 'Rate' }))
		await user.click(screen.getByRole('menuitemradio', { name: 'Good' }))

		expect(onSetRating).toHaveBeenCalledWith('good')
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
	})

	it('leaves the rating keys alone while the menu is closed', async () => {
		const user = userEvent.setup()
		const onSetRating = vi.fn()
		render(<RatingPicker onSetRating={onSetRating} rating={undefined} />)

		screen.getByRole('button', { name: 'Rate' }).focus()
		await user.keyboard('3')
		expect(onSetRating).not.toHaveBeenCalled()
	})
})
