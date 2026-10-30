import type { Id } from '@convex/_generated/dataModel'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Collection } from '~/modules/collections/types/collection.types'

import { MoveCollectionDialog } from '../MoveCollectionDialog'

const updateMutate = vi.fn()

const collections: ReadonlyArray<Collection> = [
	{
		_id: 'collection-1' as Id<'collections'>,
		_creationTime: 0,
		description: '',
		ownerId: 'user-1',
		path: [],
		searchText: 'Languages',
		title: 'Languages',
	},
	{
		_id: 'collection-2' as Id<'collections'>,
		_creationTime: 1,
		description: '',
		ownerId: 'user-1',
		parentId: 'collection-1' as Id<'collections'>,
		path: ['collection-1' as Id<'collections'>],
		searchText: 'Spanish',
		title: 'Spanish',
	},
	{
		_id: 'collection-3' as Id<'collections'>,
		_creationTime: 2,
		description: '',
		ownerId: 'user-1',
		path: [],
		searchText: 'Science',
		title: 'Science',
	},
]
const languages = collections[0] as Collection
const spanish = collections[1] as Collection

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
	useUpdateCollection: () => ({ mutate: updateMutate, isPending: false }),
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

describe('MoveCollectionDialog', () => {
	beforeEach(() => {
		updateMutate.mockClear()
	})

	it('reparents to another collection', async () => {
		const user = userEvent.setup()
		const onOpenChange = vi.fn()

		render(
			<MoveCollectionDialog
				onOpenChange={onOpenChange}
				parentId={spanish.parentId}
				collectionId={spanish._id}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Science' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(updateMutate).toHaveBeenCalledWith(
			{ collectionId: 'collection-2', parentId: 'collection-3' },
			expect.anything(),
		)
	})

	it('moves a nested collection to the root with parentId null', async () => {
		const user = userEvent.setup()

		render(
			<MoveCollectionDialog
				onOpenChange={vi.fn()}
				parentId={spanish.parentId}
				collectionId={spanish._id}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Collections' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(updateMutate).toHaveBeenCalledWith(
			{ collectionId: 'collection-2', parentId: null },
			expect.anything(),
		)
	})

	it('excludes the moving collection from the destination tree', () => {
		render(
			<MoveCollectionDialog
				onOpenChange={vi.fn()}
				parentId={languages.parentId}
				collectionId={languages._id}
			/>,
		)

		expect(
			screen.queryByRole('button', { name: 'Languages' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Spanish' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Science' }),
		).toBeInTheDocument()
	})

	it('closes only after a successful mutation', async () => {
		const user = userEvent.setup()
		const onOpenChange = vi.fn()

		render(
			<MoveCollectionDialog
				onOpenChange={onOpenChange}
				parentId={spanish.parentId}
				collectionId={spanish._id}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Science' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(onOpenChange).not.toHaveBeenCalled()

		const [, options] = updateMutate.mock.calls.at(-1) as [
			unknown,
			{ onSuccess: () => void },
		]
		act(() => options.onSuccess())

		expect(onOpenChange).toHaveBeenCalledWith(false)
	})
})
