import type { Card } from '@convex/validators/cards'
import { detectPlatform } from '@tanstack/react-hotkeys'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Archive } from 'lucide-react'
import { DateTime } from 'luxon'
import type { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SelectionActionBar } from '~/app/pages/CollectionPage/SelectionActionBar'
import type { Collection } from '~/modules/collections/types/collection.types'
import { cardStatusStyles } from '~/modules/reviews/components/cardStatusStyles'
import { toastTitleText } from '~/testing/toastTitleText'

import { CardActions } from '../CardActions'

vi.mock('@tanstack/react-router', () => ({
	Link: ({
		children,
		params,
		...props
	}: ComponentProps<'a'> & {
		params?: { cardId: string }
		to?: string
	}) => (
		<a href={`/cards/${params?.cardId}`} {...props}>
			{children}
		</a>
	),
	useNavigate: () => vi.fn(),
}))

const updateMutate = vi.fn()
const deleteMutate = vi.fn()
const moveMutate = vi.fn()

const collections = [
	{
		_id: 'collection-1' as Collection['_id'],
		_creationTime: 0,
		description: '',
		ownerId: 'user-1',
		path: [] as Collection['path'],
		searchText: 'Languages',
		title: 'Languages',
	},
	{
		_id: 'collection-2' as Collection['_id'],
		_creationTime: 1,
		description: '',
		ownerId: 'user-1',
		parentId: 'collection-1' as Collection['_id'],
		path: ['collection-1'] as Collection['path'],
		searchText: 'Spanish',
		title: 'Spanish',
	},
] as const satisfies ReadonlyArray<Collection>

const COLLECTION_LIST_KEY = ['convex', 'collections', 'list']

vi.mock('~/modules/collections/api/collectionQueries', () => ({
	collectionQueries: {
		list: () => ({
			queryKey: COLLECTION_LIST_KEY,
			queryFn: () => collections,
		}),
		search: (query: string) => ({
			queryKey: ['convex', 'collections', 'search', query],
			queryFn: () => [],
		}),
	},
}))

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQuery: (opts: { queryKey: Array<unknown> }) => {
			if (
				JSON.stringify(opts.queryKey) ===
				JSON.stringify(COLLECTION_LIST_KEY)
			) {
				return { data: collections, isError: false, isPending: false }
			}
			return { data: undefined, isError: false, isPending: true }
		},
	}
})

vi.mock('~/modules/collections/api/collectionItemQueries', () => ({
	useMoveCollectionItems: () => ({ mutate: moveMutate, isPending: false }),
	useDeleteCollectionItems: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('~/modules/collections/api/sectionQueries', () => ({
	useConvertSectionsToCollections: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
}))

vi.mock('../../api/cardQueries', () => ({
	useUpdateCards: () => ({ mutate: updateMutate, isPending: false }),
	useDeleteCards: () => ({ mutate: deleteMutate, isPending: false }),
}))

const card: Card = {
	_id: 'card-1' as Card['_id'],
	_creationTime: 0,
	collectionId: 'collection-1' as Card['collectionId'],
	ownerId: 'user-1',
	prompt: 'Question',
	answer: 'Answer',
	notes: '',
	state: 'LEARNING',
	lastReview: undefined,
	searchText: 'Question\nAnswer',
}

const secondCard = { ...card, _id: 'card-2' as Card['_id'] }

function renderWithSelection(menuCard = card) {
	render(
		<>
			<CardActions card={menuCard} />
			<CardActions card={secondCard} />
			<SelectionActionBar
				collectionId={collections[0]._id}
				contents={{
					sections: [],
					cards: [card, secondCard],
					coveredCards: [card, secondCard],
				}}
			/>
		</>,
	)
}

function openMenu() {
	return userEvent
		.setup()
		.click(screen.getByRole('button', { name: 'Card actions' }))
}

describe('CardActions', () => {
	beforeEach(() => {
		updateMutate.mockClear()
		deleteMutate.mockClear()
		moveMutate.mockClear()
	})

	it.each([
		['f', { flaggedAt: expect.any(Number) }],
		['e', { retiredAt: expect.any(Number) }],
	])(
		'scopes %s to the open card menu while several cards are selected',
		async (key, patch) => {
			const user = userEvent.setup()
			renderWithSelection()
			await user.click(
				screen.getAllByRole('button', { name: 'Card actions' })[0]!,
			)
			await user.keyboard('{Home}')
			await user.keyboard(key)

			expect(updateMutate).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({ cardIds: [card._id], ...patch }),
			)
			expect(screen.getByRole('menu')).toBeVisible()
		},
	)

	it('temporarily overrides selection shortcuts for an unselected card', async () => {
		const user = userEvent.setup()
		const unselected = { ...card, _id: 'card-3' as Card['_id'] }
		renderWithSelection(unselected)
		await user.click(
			screen.getAllByRole('button', { name: 'Card actions' })[0]!,
		)
		await user.keyboard('{Home}f{Escape}f')
		expect(updateMutate.mock.calls.map(([patch]) => patch.cardIds)).toEqual(
			[[unselected._id], [card._id, secondCard._id]],
		)
	})

	it.each(['move', 'delete'] as const)(
		'opens %s for only the menu card and preserves More after dismissal',
		async action => {
			const user = userEvent.setup()
			renderWithSelection()
			await user.click(
				screen.getAllByRole('button', { name: 'Card actions' })[0]!,
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
					name:
						action === 'move' ? 'Move card' : 'Delete “Question”?',
				}),
			).toBeVisible()
			await user.keyboard('fet')
			expect(updateMutate).not.toHaveBeenCalled()
			expect(deleteMutate).not.toHaveBeenCalled()
			await user.click(screen.getByRole('button', { name: 'Cancel' }))
			expect(screen.getByRole('menu')).toBeVisible()
		},
	)

	it('keeps row shortcuts inactive when closed and page shortcuts active', async () => {
		const user = userEvent.setup()
		const { rerender } = render(<CardActions card={card} />)
		await user.keyboard('f')
		expect(updateMutate).not.toHaveBeenCalled()

		rerender(<CardActions card={card} hasHotkeys />)
		await user.keyboard('f')
		expect(updateMutate).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ cardIds: [card._id] }),
		)
		updateMutate.mockClear()
		await openMenu()
		await user.keyboard('{Home}f')
		expect(updateMutate).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ cardIds: [card._id] }),
		)
	})

	it('hides the go-to-card action by default', () => {
		render(<CardActions card={card} />)

		expect(
			screen.queryByRole('link', { name: 'Go to card' }),
		).not.toBeInTheDocument()
	})

	it('shows the go-to-card action when enabled', () => {
		render(<CardActions card={card} showGoToCard />)

		expect(
			screen.getByRole('link', { name: 'Go to card' }),
		).toHaveAttribute('href', '/cards/card-1')
	})

	it('flags an unflagged card with the current time', async () => {
		const before = DateTime.now().toMillis()
		render(<CardActions card={card} />)

		await openMenu()
		await userEvent
			.setup()
			.click(screen.getByRole('menuitem', { name: 'Flag' }))

		expect(updateMutate).toHaveBeenCalledWith({
			cardIds: [card._id],
			flaggedAt: expect.any(Number) as number,
		})
		const [args] = updateMutate.mock.calls[0] as [{ flaggedAt: number }]
		expect(args.flaggedAt).toBeGreaterThanOrEqual(before)
	})

	it('clears the flag on a flagged card', async () => {
		render(<CardActions card={{ ...card, flaggedAt: 1_700_000_000_000 }} />)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Unflag' }))

		expect(updateMutate).toHaveBeenCalledWith({
			cardIds: [card._id],
			flaggedAt: null,
		})
	})

	it('retires an active card with the current time', async () => {
		const before = DateTime.now().toMillis()
		render(<CardActions card={card} />)

		await openMenu()
		await userEvent
			.setup()
			.click(screen.getByRole('menuitem', { name: 'Retire' }))

		// Retiring drops the card from the queues, so it offers an undo.
		expect(updateMutate).toHaveBeenCalledWith({
			cardIds: [card._id],
			retiredAt: expect.any(Number) as number,
			undo: {
				title: expect.anything() as unknown,
				icon: Archive,
				iconXstyle: cardStatusStyles.retiredOn,
				description: 'It will no longer come up for review',
				cards: [card],
			},
		})
		const [args] = updateMutate.mock.calls[0] as [
			{ retiredAt: number; undo: { title: ReactNode } },
		]
		expect(args.retiredAt).toBeGreaterThanOrEqual(before)
		expect(toastTitleText(args.undo.title)).toBe('Retired **Question**')
	})

	it('clears the retirement on a retired card', async () => {
		render(<CardActions card={{ ...card, retiredAt: 1_700_000_000_000 }} />)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Unretire' }))

		expect(updateMutate).toHaveBeenCalledWith({
			cardIds: [card._id],
			retiredAt: null,
		})
	})

	it('offers no quick-access unretire button on an active card', () => {
		render(<CardActions card={card} />)

		expect(
			screen.queryByRole('button', { name: 'Unretire' }),
		).not.toBeInTheDocument()
	})

	it('deletes only after the confirmation is accepted', async () => {
		const user = userEvent.setup()
		render(<CardActions card={card} />)

		await openMenu()
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(deleteMutate).not.toHaveBeenCalled()

		await user.click(screen.getByRole('button', { name: 'Delete' }))

		expect(deleteMutate).toHaveBeenCalledWith(
			{ cardIds: [card._id] },
			expect.anything(),
		)
	})

	it('moves to the selected collection and closes after success', async () => {
		const user = userEvent.setup()
		render(<CardActions card={card} />)

		await openMenu()
		await user.click(screen.getByRole('menuitem', { name: 'Move' }))

		const moveButton = screen.getByRole('button', { name: 'Move' })
		expect(moveButton).toBeDisabled()

		await user.click(
			screen.getByRole('button', { name: 'Toggle Languages' }),
		)
		await user.click(screen.getByRole('button', { name: 'Spanish' }))
		expect(moveButton).toBeEnabled()
		await user.click(moveButton)

		expect(moveMutate).toHaveBeenCalledWith(
			{
				sections: [],
				cards: [card],
				collectionId: collections[1]._id,
				name: 'card',
			},
			expect.anything(),
		)
		expect(
			screen.getByRole('dialog', { name: 'Move card' }),
		).toBeInTheDocument()

		const [, options] = moveMutate.mock.calls.at(-1) as [
			unknown,
			{ onSuccess: () => void },
		]
		act(() => options.onSuccess())

		expect(
			screen.queryByRole('dialog', { name: 'Move card' }),
		).not.toBeInTheDocument()
	})
})
