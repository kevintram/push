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
})
