import type { Card } from '@convex/validators/cards'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SelectionActionBar } from '../SelectionActionBar'

const updateMutate = vi.fn()
const deleteMutate = vi.fn()

vi.mock('~/modules/reviews/api/cardQueries', () => ({
	useUpdateCards: () => ({ mutate: updateMutate, isPending: false }),
	useDeleteCards: () => ({ mutate: deleteMutate, isPending: false }),
}))

const card = {
	_id: 'card-1' as Card['_id'],
	type: 'practice',
} as Card
const flagged = {
	_id: 'card-2' as Card['_id'],
	type: 'practice',
	flaggedAt: 1_700_000_000_000,
} as Card

describe('SelectionActionBar', () => {
	beforeEach(() => {
		updateMutate.mockClear()
		deleteMutate.mockClear()
	})

	it('flags the selected cards that are not flagged yet', async () => {
		render(<SelectionActionBar cards={[card, flagged]} />)

		expect(screen.getByRole('toolbar')).toHaveTextContent('2 selected')
		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Flag' }))

		// The already flagged card keeps its flag time.
		expect(updateMutate).toHaveBeenCalledWith(
			{ cardIds: [card._id], flaggedAt: expect.any(Number) as number },
			expect.anything(),
		)
	})

	it('retires and retypes the selection from the more menu', async () => {
		const user = userEvent.setup()
		render(<SelectionActionBar cards={[card, flagged]} />)

		await user.click(screen.getByRole('button', { name: 'More actions' }))
		await user.click(screen.getByRole('menuitem', { name: 'Retire' }))
		await user.click(screen.getByRole('button', { name: 'More actions' }))
		await user.click(
			screen.getByRole('menuitem', { name: 'Mark as flashcards' }),
		)

		expect(updateMutate).toHaveBeenCalledWith(
			{
				cardIds: [card._id, flagged._id],
				retiredAt: expect.any(Number) as number,
			},
			expect.anything(),
		)
		expect(updateMutate).toHaveBeenCalledWith(
			{ cardIds: [card._id, flagged._id], type: 'flashcard' },
			expect.anything(),
		)
	})

	it('deletes the whole selection after confirming', async () => {
		const user = userEvent.setup()
		render(<SelectionActionBar cards={[card, flagged]} />)

		await user.click(screen.getByRole('button', { name: 'Delete' }))
		const dialog = screen.getByRole('dialog', { name: 'Delete 2 cards?' })
		expect(deleteMutate).not.toHaveBeenCalled()
		await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

		expect(deleteMutate).toHaveBeenCalledWith(
			{ cardIds: [card._id, flagged._id] },
			expect.anything(),
		)
	})
})
