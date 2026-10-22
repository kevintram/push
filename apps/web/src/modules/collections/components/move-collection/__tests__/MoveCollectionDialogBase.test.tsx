import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Collection } from '~/modules/collections/types/collection.types'

import { MoveCollectionDialogBase } from '../MoveCollectionDialogBase'

const collections = [
	{
		_id: 'collection-1' as Id<'collections'>,
		_creationTime: 0,
		description: '',
		ownerId: 'user-1',
		path: [] as Collection['path'],
		searchText: 'Languages',
		title: 'Languages',
	},
	{
		_id: 'collection-2' as Id<'collections'>,
		_creationTime: 1,
		description: '',
		ownerId: 'user-1',
		parentId: 'collection-1' as Id<'collections'>,
		path: ['collection-1'] as Collection['path'],
		searchText: 'Spanish',
		title: 'Spanish',
	},
	{
		_id: 'collection-3' as Id<'collections'>,
		_creationTime: 2,
		description: '',
		ownerId: 'user-1',
		path: [] as Collection['path'],
		searchText: 'Science',
		title: 'Science',
	},
] as const satisfies ReadonlyArray<Collection>

const COLLECTION_LIST_KEY = ['convex', 'collections', 'list']

type QueryState = {
	data: ReadonlyArray<Collection> | undefined
	isError: boolean
	isPending: boolean
}

let queryState: QueryState

type CollectionOnlyDialogProps = Extract<
	React.ComponentProps<typeof MoveCollectionDialogBase>,
	{ allowRoot?: false }
>

vi.mock('~/modules/collections/api/collectionQueries', () => ({
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
		useQuery: () => queryState,
	}
})

function renderDialog(overrides: Partial<CollectionOnlyDialogProps> = {}) {
	const defaults = {
		initialDestination: 'collection-1' as Id<'collections'>,
		isPending: false,
		onMove: vi.fn(),
		onOpenChange: vi.fn(),
		title: 'Move item',
	} satisfies CollectionOnlyDialogProps

	const props = { ...defaults, ...overrides }
	render(<MoveCollectionDialogBase {...props} />)
	return props
}

describe('MoveCollectionDialogBase', () => {
	beforeEach(() => {
		queryState = {
			data: [...collections],
			isError: false,
			isPending: false,
		}
	})

	it('renders loading state', () => {
		queryState = { data: undefined, isError: false, isPending: true }
		renderDialog()

		expect(screen.getByText('Loading collections…')).toBeInTheDocument()
	})

	it('renders error state', () => {
		queryState = { data: undefined, isError: true, isPending: false }
		renderDialog()

		expect(
			screen.getByText('Could not load collections.'),
		).toBeInTheDocument()
	})

	it('renders empty state', () => {
		queryState = { data: [], isError: false, isPending: false }
		renderDialog()

		expect(
			screen.getByText('No collections available.'),
		).toBeInTheDocument()
	})

	it('disables Move when destination has not changed', () => {
		renderDialog({
			initialDestination: 'collection-1' as Id<'collections'>,
		})

		expect(screen.getByRole('button', { name: 'Move' })).toBeDisabled()
	})

	it('enables Move when a different destination is selected', async () => {
		renderDialog({
			initialDestination: 'collection-1' as Id<'collections'>,
		})

		const user = userEvent.setup()
		await user.click(
			screen.getByRole('button', { name: 'Toggle Languages' }),
		)
		await user.click(screen.getByRole('button', { name: 'Spanish' }))

		expect(screen.getByRole('button', { name: 'Move' })).toBeEnabled()
	})

	it('calls onMove with the selected destination', async () => {
		const { onMove } = renderDialog({
			initialDestination: 'collection-1' as Id<'collections'>,
		})
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: 'Science' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(onMove).toHaveBeenCalledWith('collection-3')
	})

	it('disables controls while pending', () => {
		renderDialog({ isPending: true })

		expect(screen.getByRole('button', { name: 'Moving…' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
	})

	it('prevents dismissal while pending', () => {
		const { onOpenChange } = renderDialog({ isPending: true })

		const dialog = screen.getByRole('dialog')
		expect(dialog).toBeInTheDocument()

		// attempt to close via the close button
		const closeButton = screen.getByRole('button', { name: 'Close' })
		closeButton.click()

		expect(onOpenChange).not.toHaveBeenCalled()
	})

	it('calls onMove with null when Collections root is selected', async () => {
		const onMove = vi.fn()
		render(
			<MoveCollectionDialogBase
				allowRoot
				initialDestination={'collection-1' as Id<'collections'>}
				isPending={false}
				onMove={onMove}
				onOpenChange={vi.fn()}
				title='Move item'
			/>,
		)
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: 'Collections' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(onMove).toHaveBeenCalledWith(null)
	})
})
