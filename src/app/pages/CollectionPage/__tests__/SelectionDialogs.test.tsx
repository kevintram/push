import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'
import { render, screen, within } from '@testing-library/react'
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

const card = (id: string) =>
	({ _id: id as Id<'cards'>, prompt: `Card ${id}` }) as Card
const section = { _id: 'A' as Id<'sections'>, title: 'A section' } as Section

describe('SelectionDialogs', () => {
	it.each([
		{
			cards: [
				{
					...card('a'),
					prompt: 'A full card prompt that stays visible in the confirmation',
				},
			],
			sections: [],
			title: 'Delete “A full card prompt that stays visible in the confirmation”?',
		},
		{
			cards: [{ ...card('a'), prompt: '  ' }],
			sections: [],
			title: 'Delete “Untitled card”?',
		},
		{ cards: [], sections: [section], title: 'Delete “A section”?' },
		{
			cards: [],
			sections: [{ ...section, title: '  ' }],
			title: 'Delete “Untitled section”?',
		},
		{
			cards: [card('a'), card('b')],
			sections: [],
			title: 'Delete 2 cards?',
		},
	])('names the delete dialog $title', ({ cards, sections, title }) => {
		render(
			<SelectionDialogs
				collectionId={collections[0]!._id}
				contents={{ cards, sections, coveredCards: cards }}
				dialog='delete'
				onDialogChange={vi.fn()}
			/>,
		)
		expect(screen.getByRole('dialog', { name: title })).toBeInTheDocument()
	})

	it('counts cards inside selected sections once without showing their names', () => {
		const child = card('child')
		const loose = card('loose')
		const contents = selectionContents(
			{ unsectioned: [loose], sections: [{ section, cards: [child] }] },
			new Set([section._id]),
			new Set([child._id, loose._id]),
		)
		render(
			<SelectionDialogs
				collectionId={collections[0]!._id}
				contents={contents}
				dialog='delete'
				onDialogChange={vi.fn()}
			/>,
		)
		const dialog = screen.getByRole('dialog', {
			name: 'Delete 1 section and 2 cards?',
		})
		expect(dialog).toHaveTextContent(
			'This section, all 2 cards, and their reviews will be permanently deleted.',
		)
		expect(within(dialog).getByText('permanently').tagName).toBe('STRONG')
		const warning = within(dialog).getByText("You can't undo this action.")
		expect(warning.tagName).toBe('STRONG')
		expect(warning.parentElement?.tagName).toBe('P')
		expect(warning.parentElement?.previousElementSibling).toHaveTextContent(
			'permanently deleted.',
		)
		expect(dialog).not.toHaveTextContent(section.title)
		expect(dialog).not.toHaveTextContent(child.prompt)
		expect(dialog).not.toHaveTextContent(loose.prompt)
	})

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
