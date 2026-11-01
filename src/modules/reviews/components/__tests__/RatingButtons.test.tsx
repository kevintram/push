import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { RatingButtons } from '../RatingButtons'

describe('RatingButtons', () => {
	it('lists the ratings, then Todo, with Todo checked when unrated', () => {
		render(
			<RatingButtons
				hotkeyTarget={null}
				onSetRating={vi.fn()}
				rating={undefined}
			/>,
		)

		const radios = screen.getAllByRole('radio')
		expect(radios.map(radio => radio.textContent)).toEqual([
			'Miss1',
			'Hard2',
			'Good3',
			'Easy4',
			'Todo0',
		])
		expect(screen.getByRole('radio', { name: 'Todo' })).toBeChecked()
	})

	it('picks a rating on click, and clears it with Todo', async () => {
		const user = userEvent.setup()
		const onSetRating = vi.fn()
		render(
			<RatingButtons
				hotkeyTarget={null}
				onSetRating={onSetRating}
				rating='good'
			/>,
		)

		await user.click(screen.getByRole('radio', { name: 'Easy' }))
		expect(onSetRating).toHaveBeenLastCalledWith('easy')

		await user.click(screen.getByRole('radio', { name: 'Todo' }))
		expect(onSetRating).toHaveBeenLastCalledWith(null)
	})

	it('picks a rating from the menu the tray collapses into', async () => {
		const user = userEvent.setup()
		const onSetRating = vi.fn()
		render(
			<RatingButtons
				hotkeyTarget={null}
				onSetRating={onSetRating}
				rating='good'
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Good' }))
		await user.click(screen.getByRole('menuitemradio', { name: 'Hard' }))
		expect(onSetRating).toHaveBeenLastCalledWith('hard')
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
	})

	it('picks a rating with its key anywhere in its hotkey target, except while typing', async () => {
		const user = userEvent.setup()
		const onSetRating = vi.fn()
		function Modal() {
			const [target, setTarget] = useState<HTMLDivElement | null>(null)
			return (
				<div ref={setTarget}>
					<button type='button'>Inside</button>
					<textarea aria-label='Description' />
					<RatingButtons
						hotkeyTarget={target}
						onSetRating={onSetRating}
						rating='good'
					/>
				</div>
			)
		}
		render(<Modal />)

		await user.type(
			screen.getByRole('textbox', { name: 'Description' }),
			'2',
		)
		// The current rating's own key changes nothing.
		screen.getByRole('button', { name: 'Inside' }).focus()
		await user.keyboard('3')
		expect(onSetRating).not.toHaveBeenCalled()

		await user.keyboard('4')
		expect(onSetRating).toHaveBeenLastCalledWith('easy')
		await user.keyboard('0')
		expect(onSetRating).toHaveBeenLastCalledWith(null)
	})
})
