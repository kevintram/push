import type { Card } from '@convex/validators/cards'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateTime } from 'luxon'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Collection } from '~/modules/library/types/collection.types'

import { CardActions } from '../CardActions'

const updateMutate = vi.fn()
const deleteMutate = vi.fn()

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

vi.mock('~/modules/library/api/collectionQueries', () => ({
	collectionQueries: {
		list: () => ({
			queryKey: COLLECTION_LIST_KEY,
			queryFn: () => collections,
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

vi.mock('../../api/cardQueries', () => ({
	useUpdateCard: () => ({ mutate: updateMutate, isPending: false }),
	useDeleteCard: () => ({ mutate: deleteMutate, isPending: false }),
}))

const card: Card = {
	_id: 'card-1' as Card['_id'],
	_creationTime: 0,
	collectionId: 'collection-1' as Card['collectionId'],
	ownerId: 'user-1',
	type: 'flashcard',
	primaryText: 'Question',
	secondaryText: 'Answer',
	notes: '',
	state: 'LEARNING',
	lastReview: undefined,
	searchText: 'Question\nAnswer',
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
	})

	it('turns a flashcard into a practice card', async () => {
		render(<CardActions card={card} />)

		await openMenu()
		await userEvent
			.setup()
			.click(
				screen.getByRole('menuitem', { name: 'Remove as flashcard' }),
			)

		expect(updateMutate).toHaveBeenCalledWith(
			{ cardId: card._id, type: 'practice' },
			expect.anything(),
		)
	})

	it('flags an unflagged card with the current time', async () => {
		const before = DateTime.now().toMillis()
		render(<CardActions card={card} />)

		await openMenu()
		await userEvent
			.setup()
			.click(screen.getByRole('menuitem', { name: 'Flag' }))

		expect(updateMutate).toHaveBeenCalledWith(
			{
				cardId: card._id,
				flaggedAt: expect.any(Number) as number,
			},
			expect.anything(),
		)
		const [args] = updateMutate.mock.calls[0] as [{ flaggedAt: number }]
		expect(args.flaggedAt).toBeGreaterThanOrEqual(before)
	})

	it('clears the flag on a flagged card', async () => {
		render(<CardActions card={{ ...card, flaggedAt: 1_700_000_000_000 }} />)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Unflag' }))

		expect(updateMutate).toHaveBeenCalledWith(
			{ cardId: card._id, flaggedAt: null },
			expect.anything(),
		)
	})

	it('deletes only after the confirmation is accepted', async () => {
		const user = userEvent.setup()
		render(<CardActions card={card} />)

		await openMenu()
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(deleteMutate).not.toHaveBeenCalled()

		await user.click(screen.getByRole('button', { name: 'Delete' }))

		expect(deleteMutate).toHaveBeenCalledWith(
			{ cardId: card._id },
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

		await user.click(screen.getByRole('button', { name: 'Spanish' }))
		expect(moveButton).toBeEnabled()
		await user.click(moveButton)

		expect(updateMutate).toHaveBeenCalledWith(
			{
				cardId: card._id,
				collectionId: collections[1]._id,
			},
			expect.anything(),
		)
		expect(
			screen.getByRole('dialog', { name: 'Move card' }),
		).toBeInTheDocument()

		const [, options] = updateMutate.mock.calls.at(-1) as [
			unknown,
			{ onSuccess: () => void },
		]
		act(() => options.onSuccess())

		expect(
			screen.queryByRole('dialog', { name: 'Move card' }),
		).not.toBeInTheDocument()
	})
})
