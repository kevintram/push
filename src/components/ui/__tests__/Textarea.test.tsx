import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Textarea } from '../Textarea'

describe('Textarea', () => {
	it('stops editing on Escape but keeps focus, and edits again on Enter', async () => {
		const user = userEvent.setup()
		const onCommit = vi.fn()
		render(<Textarea aria-label='Notes' onCommit={onCommit} />)
		const field = screen.getByRole('textbox', { name: 'Notes' })

		await user.click(field)
		await user.keyboard('a{Escape}b')
		expect(onCommit).toHaveBeenCalledOnce()
		expect(field).toHaveFocus()
		expect(field).toHaveAttribute('readonly')
		expect(field).toHaveValue('a')

		await user.keyboard('{Enter}c')
		expect(field).not.toHaveAttribute('readonly')
		expect(field).toHaveValue('ac')

		field.blur()
		expect(onCommit).toHaveBeenCalledTimes(2)
	})

	it('keeps the first Escape from its surroundings, and lets the second through', async () => {
		const user = userEvent.setup()
		const onKeyDown = vi.fn()
		render(
			<div onKeyDown={event => onKeyDown(event.key)}>
				<Textarea aria-label='Notes' />
			</div>,
		)

		await user.click(screen.getByRole('textbox', { name: 'Notes' }))
		await user.keyboard('{Escape}')
		expect(onKeyDown).not.toHaveBeenCalledWith('Escape')

		await user.keyboard('{Escape}')
		expect(onKeyDown).toHaveBeenCalledWith('Escape')
	})

	it('edits again when clicked, but stays stopped when focus returns', async () => {
		const user = userEvent.setup()
		render(
			<>
				<Textarea aria-label='Notes' />
				<button type='button'>Elsewhere</button>
			</>,
		)
		const field = screen.getByRole('textbox', { name: 'Notes' })

		await user.click(field)
		await user.keyboard('{Escape}')
		await user.click(field)
		expect(field).not.toHaveAttribute('readonly')

		await user.keyboard('{Escape}')
		screen.getByRole('button', { name: 'Elsewhere' }).focus()
		field.focus()
		expect(field).toHaveAttribute('readonly')
	})

	it('leaves Escape alone when stopping on Escape is off', async () => {
		const user = userEvent.setup()
		const onKeyDown = vi.fn()
		render(
			<Textarea
				aria-label='Title'
				onKeyDown={event => onKeyDown(event.key)}
				stopEditingOnEscape={false}
			/>,
		)
		const field = screen.getByRole('textbox', { name: 'Title' })

		await user.click(field)
		await user.keyboard('{Escape}')
		expect(onKeyDown).toHaveBeenCalledWith('Escape')
		expect(field).not.toHaveAttribute('readonly')
	})
})
