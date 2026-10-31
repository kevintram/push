import type { Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import type { Section } from '@convex/validators/sections'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Collection } from '~/modules/collections/types/collection.types'

import { MoveCollectionItemsDialog } from '../MoveCollectionItemsDialog'

const moveMutate = vi.fn()

const collections: ReadonlyArray<Collection> = [
	{
		_id: 'collection-1' as Id<'collections'>,
		_creationTime: 0,
		description: '',
		ownerId: 'user-1',
		path: [],
		searchText: 'Biology',
		title: 'Biology',
	},
	{
		_id: 'collection-2' as Id<'collections'>,
		_creationTime: 1,
		description: '',
		ownerId: 'user-1',
		path: [],
		searchText: 'Chemistry',
		title: 'Chemistry',
	},
]

vi.mock('~/modules/collections/api/collectionQueries', () => ({
	collectionQueries: {
		list: () => ({
			queryKey: ['convex', 'collections', 'list'],
			queryFn: () => collections,
		}),
		search: (query: string) => ({
			queryKey: ['convex', 'collections', 'search', query],
			queryFn: () => [],
		}),
	},
}))

vi.mock('~/modules/collections/api/collectionItemQueries', () => ({
	useMoveCollectionItems: () => ({
		mutate: moveMutate,
		isPending: false,
	}),
}))

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQuery: (options: { queryKey: Array<string> }) =>
			options.queryKey.includes('list')
				? { data: [...collections], isError: false, isPending: false }
				: { data: undefined, isError: false, isPending: true },
	}
})

const section = { _id: 'section-1' } as Section
const card = { _id: 'card-1' } as Card

describe('MoveCollectionItemsDialog', () => {
	it('moves the items to the picked collection and closes on success', async () => {
		const user = userEvent.setup()
		const onOpenChange = vi.fn()

		render(
			<MoveCollectionItemsDialog
				onOpenChange={onOpenChange}
				collectionId={'collection-1' as Id<'collections'>}
				sections={[section]}
				cards={[card]}
				name='1 section and 1 card'
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Chemistry' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		const [args, options] = moveMutate.mock.calls.at(-1) as [
			unknown,
			{ onSuccess: () => void },
		]
		expect(args).toEqual({
			sections: [section],
			cards: [card],
			collectionId: 'collection-2',
			name: '1 section and 1 card',
		})
		expect(onOpenChange).not.toHaveBeenCalled()

		act(() => options.onSuccess())

		expect(onOpenChange).toHaveBeenCalledWith(false)
	})
})
