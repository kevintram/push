import type { Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import type { Section } from '@convex/validators/sections'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SelectionActionBar } from '../SelectionActionBar'

const updateMutate = vi.fn()
const convertMutate = vi.fn()
const deleteItemsMutate = vi.fn()

vi.mock('~/modules/reviews/api/cardQueries', () => ({
	useUpdateCards: () => ({ mutate: updateMutate, isPending: false }),
	useDeleteCards: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('~/modules/collections/api/sectionQueries', () => ({
	useConvertSectionsToCollections: () => ({
		mutate: convertMutate,
		isPending: false,
	}),
}))

vi.mock('~/modules/collections/api/collectionItemQueries', () => ({
	useDeleteCollectionItems: () => ({
		mutate: deleteItemsMutate,
		isPending: false,
	}),
}))

const collectionId = 'collection-1' as Id<'collections'>
const card = (id: string, fields: Partial<Card> = {}) =>
	({ _id: id as Card['_id'], type: 'practice', ...fields }) as Card
const section = { _id: 'section-1' as Section['_id'] } as Section

const loose = card('card-1')
const flagged = card('card-2', { flaggedAt: 1_700_000_000_000 })
const inSection = card('card-3')

describe('SelectionActionBar', () => {
	beforeEach(() => {
		updateMutate.mockClear()
		convertMutate.mockClear()
		deleteItemsMutate.mockClear()
	})

	it('flags the selected cards that are not flagged yet', async () => {
		render(
			<SelectionActionBar
				collectionId={collectionId}
				contents={{
					sections: [],
					cards: [loose, flagged],
					coveredCards: [loose, flagged],
				}}
			/>,
		)

		expect(screen.getByRole('toolbar')).toHaveTextContent('2 cards')
		expect(
			screen.queryByRole('menuitem', { name: /Convert/ }),
		).not.toBeInTheDocument()
		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Flag' }))

		// The already flagged card keeps its flag time.
		expect(updateMutate).toHaveBeenCalledWith({
			cardIds: [loose._id],
			flaggedAt: expect.any(Number) as number,
		})
	})

	it("applies card actions to a selected section's cards, and converts the section", async () => {
		const user = userEvent.setup()
		render(
			<SelectionActionBar
				collectionId={collectionId}
				contents={{
					sections: [section],
					cards: [loose],
					coveredCards: [loose, inSection],
				}}
			/>,
		)

		expect(screen.getByRole('toolbar')).toHaveTextContent(
			'1 section, 2 cards',
		)
		await user.click(screen.getByRole('button', { name: 'More actions' }))
		await user.click(screen.getByRole('menuitem', { name: 'Retire' }))
		await user.click(screen.getByRole('button', { name: 'More actions' }))
		await user.click(
			screen.getByRole('menuitem', { name: 'Convert to subcollection' }),
		)

		expect(updateMutate).toHaveBeenCalledWith({
			cardIds: [loose._id, inSection._id],
			retiredAt: expect.any(Number) as number,
		})
		expect(convertMutate).toHaveBeenCalledWith({
			sectionIds: [section._id],
		})
	})

	it('offers no card actions for a section without cards', async () => {
		const user = userEvent.setup()
		render(
			<SelectionActionBar
				collectionId={collectionId}
				contents={{ sections: [section], cards: [], coveredCards: [] }}
			/>,
		)

		expect(
			screen.queryByRole('button', { name: 'Flag' }),
		).not.toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: 'More actions' }))
		expect(
			screen.getAllByRole('menuitem').map(item => item.textContent),
		).toEqual(['Convert to subcollection'])
	})

	it('deletes the sections and cards after confirming', async () => {
		const user = userEvent.setup()
		render(
			<SelectionActionBar
				collectionId={collectionId}
				contents={{
					sections: [section],
					cards: [loose],
					coveredCards: [loose, inSection],
				}}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Delete' }))
		const dialog = screen.getByRole('dialog', {
			name: 'Delete 1 section and 2 cards?',
		})
		expect(dialog).toHaveTextContent(
			'This section, its cards, the other selected cards, and their review history will be permanently deleted.',
		)
		expect(deleteItemsMutate).not.toHaveBeenCalled()
		await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

		expect(deleteItemsMutate).toHaveBeenCalledWith(
			{ sectionIds: [section._id], cardIds: [loose._id] },
			expect.anything(),
		)
	})
})
