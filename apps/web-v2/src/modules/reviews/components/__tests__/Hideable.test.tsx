import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Hideable } from '../Hideable'

describe('Hideable', () => {
	it('starts hidden by default', () => {
		render(<Hideable>Answer</Hideable>)

		expect(
			screen.getByRole('button', { name: 'Reveal' }),
		).toBeInTheDocument()
	})

	it('starts revealed when defaultRevealed is true', () => {
		render(<Hideable defaultRevealed>Answer</Hideable>)

		expect(
			screen.queryByRole('button', { name: 'Reveal' }),
		).not.toBeInTheDocument()
	})

	it('reveals uncontrolled content and notifies the consumer', async () => {
		const user = userEvent.setup()
		const onRevealedChange = vi.fn()
		render(<Hideable onRevealedChange={onRevealedChange}>Answer</Hideable>)

		await user.click(screen.getByRole('button', { name: 'Reveal' }))

		expect(onRevealedChange).toHaveBeenCalledWith(true)
		expect(
			screen.queryByRole('button', { name: 'Reveal' }),
		).not.toBeInTheDocument()
	})

	it('does not reset uncontrolled state when defaultRevealed changes', async () => {
		const user = userEvent.setup()
		const { rerender } = render(
			<Hideable defaultRevealed={false}>Answer</Hideable>,
		)

		await user.click(screen.getByRole('button', { name: 'Reveal' }))
		rerender(<Hideable defaultRevealed={true}>Answer</Hideable>)
		rerender(<Hideable defaultRevealed={false}>Answer</Hideable>)

		expect(
			screen.queryByRole('button', { name: 'Reveal' }),
		).not.toBeInTheDocument()
	})

	it('waits for the controlled value to change before revealing', async () => {
		const user = userEvent.setup()
		const onRevealedChange = vi.fn()
		const { rerender } = render(
			<Hideable revealed={false} onRevealedChange={onRevealedChange}>
				Answer
			</Hideable>,
		)

		await user.click(screen.getByRole('button', { name: 'Reveal' }))

		expect(onRevealedChange).toHaveBeenCalledWith(true)
		expect(
			screen.getByRole('button', { name: 'Reveal' }),
		).toBeInTheDocument()

		rerender(
			<Hideable revealed onRevealedChange={onRevealedChange}>
				Answer
			</Hideable>,
		)
		expect(
			screen.queryByRole('button', { name: 'Reveal' }),
		).not.toBeInTheDocument()
	})
})
