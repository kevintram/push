import type { Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import type { Section } from '@convex/validators/sections'
import { detectPlatform } from '@tanstack/react-hotkeys'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Archive, Flag } from 'lucide-react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cardStatusStyles } from '~/modules/reviews/components/cardStatusStyles'
import { toastTitleText } from '~/testing/toastTitleText'

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

// Keep the real dialog focus/scope behavior; the move picker's queries have
// their own coverage.
vi.mock(
	'~/modules/collections/components/MoveCollectionItemsDialog',
	async () => {
		const { Button, Dialog, DialogContent, DialogTitle } =
			await import('~/components/ui')
		return {
			MoveCollectionItemsDialog: ({
				onOpenChange,
			}: {
				onOpenChange: (open: boolean) => void
			}) => (
				<Dialog open onOpenChange={onOpenChange}>
					<DialogContent>
						<DialogTitle>Move card</DialogTitle>
						<Button onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
					</DialogContent>
				</Dialog>
			),
		}
	},
)

const collectionId = 'collection-1' as Id<'collections'>
const card = (id: string, fields: Partial<Card> = {}) =>
	({
		_id: id as Card['_id'],
		type: 'practice',
		primaryText: 'A card',
		...fields,
	}) as Card
const section = {
	_id: 'section-1' as Section['_id'],
	title: 'A section',
} as Section

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

		// The already flagged card keeps its flag time, and so is left out of
		// the undo too.
		expect(updateMutate).toHaveBeenCalledWith({
			cardIds: [loose._id],
			flaggedAt: expect.any(Number) as number,
			undo: {
				icon: Flag,
				iconXstyle: cardStatusStyles.flagOn,
				title: 'Flagged 1 card',
				open: {
					label: 'View all flagged',
					onClick: expect.any(Function) as () => void,
				},
				cards: [loose],
			},
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
		expect(screen.getByRole('menu')).toBeVisible()
		await user.click(
			screen.getByRole('menuitem', { name: 'Convert to subcollection' }),
		)

		expect(updateMutate).toHaveBeenCalledWith({
			cardIds: [loose._id, inSection._id],
			retiredAt: expect.any(Number) as number,
			undo: {
				title: expect.anything() as unknown,
				icon: Archive,
				iconXstyle: cardStatusStyles.retiredOn,
				description: 'They will no longer come up for review',
				cards: [loose, inSection],
			},
		})
		const [{ undo }] = updateMutate.mock.lastCall as [
			{ undo: { title: ReactNode } },
		]
		expect(toastTitleText(undo.title)).toBe('Retired 2 cards')
		expect(convertMutate).toHaveBeenCalledWith({ sections: [section] })
		expect(screen.getByRole('menu')).toBeVisible()
	})

	it.each([
		['f', { flaggedAt: expect.any(Number) }],
		['e', { retiredAt: expect.any(Number) }],
		['t', { type: 'flashcard' }],
	])(
		'runs %s from the More menu once and leaves it open',
		async (key, patch) => {
			const user = userEvent.setup()
			render(
				<SelectionActionBar
					collectionId={collectionId}
					contents={{
						sections: [section],
						cards: [],
						coveredCards: [inSection],
					}}
				/>,
			)
			await user.click(
				screen.getByRole('button', { name: 'More actions' }),
			)
			await user.keyboard('{Home}')
			await user.keyboard(key)

			expect(updateMutate).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					cardIds: [inSection._id],
					...patch,
				}),
			)
			expect(screen.getByRole('menu')).toBeVisible()
		},
	)

	it.each(['move', 'delete'] as const)(
		'opens %s from More and keeps More open after dismissing the dialog',
		async action => {
			const user = userEvent.setup()
			render(
				<SelectionActionBar
					collectionId={collectionId}
					contents={{
						sections: [],
						cards: [loose],
						coveredCards: [loose],
					}}
				/>,
			)
			await user.click(
				screen.getByRole('button', { name: 'More actions' }),
			)
			await user.keyboard('{Home}')
			const modifier = detectPlatform() === 'mac' ? 'Meta' : 'Control'
			await user.keyboard(
				action === 'move'
					? 'm'
					: `{${modifier}>}{Backspace}{/${modifier}}`,
			)
			expect(
				screen.getByRole('dialog', {
					name: action === 'move' ? 'Move card' : 'Delete “A card”?',
				}),
			).toBeVisible()
			expect(deleteItemsMutate).not.toHaveBeenCalled()
			await user.keyboard('fet')
			expect(updateMutate).not.toHaveBeenCalled()
			await user.click(screen.getByRole('button', { name: 'Cancel' }))
			expect(screen.getByRole('menu')).toBeVisible()
		},
	)

	it('preserves menu navigation, activation, and dismissal', async () => {
		const user = userEvent.setup()
		render(
			<SelectionActionBar
				collectionId={collectionId}
				contents={{
					sections: [],
					cards: [loose],
					coveredCards: [loose],
				}}
			/>,
		)
		await user.click(screen.getByRole('button', { name: 'More actions' }))
		await user.keyboard('{Home}')
		await user.keyboard('{ArrowDown}')
		expect(
			screen.getByRole('menuitem', { name: 'Mark as flashcard' }),
		).toHaveFocus()
		await user.keyboard('{Enter}')
		expect(updateMutate).toHaveBeenCalledExactlyOnceWith({
			cardIds: [loose._id],
			type: 'flashcard',
		})
		expect(screen.getByRole('menu')).toBeVisible()
		await user.keyboard('{Escape}')
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
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
		await user.keyboard('{Home}')
		await user.keyboard('fet')
		expect(updateMutate).not.toHaveBeenCalled()
		expect(screen.getByRole('menu')).toBeVisible()
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
			'This section, all 2 cards, and their reviews will be permanently deleted.',
		)
		expect(deleteItemsMutate).not.toHaveBeenCalled()
		await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

		expect(deleteItemsMutate).toHaveBeenCalledWith(
			{
				sectionIds: [section._id],
				cardIds: [loose._id],
				name: '1 section and 2 cards',
			},
			expect.anything(),
		)
	})
})
