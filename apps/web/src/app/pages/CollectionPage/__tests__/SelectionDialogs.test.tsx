import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Collection } from '~/modules/collections/types/collection.types'
import type { Card } from '~/modules/reviews/types/review.types'

import { selectionContents } from '../selectionContents'
import { SelectionDialogs } from '../SelectionDialogs'

const moveMutate = vi.fn()

const collection = (id: string, title: string) =>
	({ _id: id as Id<'collections'>, path: [], title }) as unknown as Collection
const collections = [
	collection('collection-1', 'Biology'),
	collection('collection-2', 'Chemistry'),
]

vi.mock('~/modules/collections/api/collectionQueries', () => ({
	collectionQueries: {
		search: (query: string) => ({
			queryKey: ['convex', 'collections', 'search', query],
			queryFn: () => [],
		}),
		list: () => ({
			queryKey: ['convex', 'collections', 'list'],
			queryFn: () => collections,
		}),
	},
}))

vi.mock('~/modules/collections/api/collectionItemQueries', () => ({
	useMoveCollectionItems: () => ({ mutate: moveMutate, isPending: false }),
	useDeleteCollectionItems: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQuery: ({ queryFn }: { queryFn: () => unknown }) => ({
			data: queryFn(),
			isError: false,
			isPending: false,
		}),
	}
})

const card = (id: string) => ({ _id: id as Id<'cards'> }) as Card
const section = { _id: 'A' as Id<'sections'> } as Section

describe('SelectionDialogs', () => {
	it("names a move by the selection, counting a selected section's cards", async () => {
		const user = userEvent.setup()
		// u1 | A: a1 a2, with A and u1 selected.
		const contents = selectionContents(
			{
				unsectioned: [card('u1')],
				sections: [{ section, cards: [card('a1'), card('a2')] }],
			},
			new Set([section._id]),
			new Set(['u1' as Id<'cards'>]),
		)

		render(
			<SelectionDialogs
				collectionId={collections[0]!._id}
				contents={contents}
				dialog='move'
				onDialogChange={vi.fn()}
			/>,
		)

		expect(
			screen.getByRole('dialog', { name: 'Move 1 section and 3 cards' }),
		).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: 'Chemistry' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		// The undo toast reads "Moved" and this name, so it matches the title.
		expect(moveMutate).toHaveBeenCalledWith(
			expect.objectContaining({ name: '1 section and 3 cards' }),
			expect.anything(),
		)
	})
})
