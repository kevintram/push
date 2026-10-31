import type { Id } from '@convex/_generated/dataModel'
import type { CollectionSearchResult } from '@convex/validators/collections'
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

const searchHits: Record<string, ReadonlyArray<CollectionSearchResult>> = {
	s: [
		{
			_id: 'collection-2' as Id<'collections'>,
			title: 'Spanish',
			description: 'Verbs and vocab',
			pathTitles: ['Languages'],
		},
		{
			_id: 'collection-3' as Id<'collections'>,
			title: 'Science',
			description: '',
			pathTitles: [],
		},
	],
	lang: [
		{
			_id: 'collection-1' as Id<'collections'>,
			title: 'Languages',
			description: '',
			pathTitles: [],
		},
	],
}

const COLLECTION_LIST_KEY = ['convex', 'collections', 'list']

type QueryState = {
	data: ReadonlyArray<Collection> | undefined
	isError: boolean
	isPending: boolean
}

let listState: QueryState

type CollectionOnlyDialogProps = Extract<
	React.ComponentProps<typeof MoveCollectionDialogBase>,
	{ allowRoot?: false }
>

vi.mock('~/modules/collections/api/collectionQueries', () => ({
	collectionQueries: {
		list: () => ({ queryKey: COLLECTION_LIST_KEY }),
		search: (query: string) => ({
			queryKey: ['convex', 'collections', 'search', query],
		}),
	},
}))

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQuery: (options: { enabled?: boolean; queryKey: Array<string> }) => {
			if (options.queryKey === COLLECTION_LIST_KEY) return listState
			if (options.enabled === false) {
				return { data: undefined, isError: false, isPending: true }
			}
			return {
				data: searchHits[options.queryKey[3]!] ?? [],
				isError: false,
				isPending: false,
			}
		},
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

function renderRootDialog(
	overrides: Partial<
		Extract<
			React.ComponentProps<typeof MoveCollectionDialogBase>,
			{ allowRoot: true }
		>
	> = {},
) {
	const props = {
		allowRoot: true as const,
		initialDestination: 'collection-1' as Id<'collections'> | null,
		isPending: false,
		onMove: vi.fn(),
		onOpenChange: vi.fn(),
		title: 'Move collection',
		...overrides,
	}
	render(<MoveCollectionDialogBase {...props} />)
	return props
}

describe('MoveCollectionDialogBase', () => {
	beforeEach(() => {
		listState = {
			data: [...collections],
			isError: false,
			isPending: false,
		}
	})

	it('renders loading state', () => {
		listState = { data: undefined, isError: false, isPending: true }
		renderDialog()

		expect(screen.getByText('Loading collections…')).toBeInTheDocument()
	})

	it('renders error state', () => {
		listState = { data: undefined, isError: true, isPending: false }
		renderDialog()

		expect(
			screen.getByText('Could not load collections.'),
		).toBeInTheDocument()
	})

	it('renders empty state', () => {
		listState = { data: [], isError: false, isPending: false }
		renderDialog()

		expect(
			screen.getByText('No collections available.'),
		).toBeInTheDocument()
	})

	it('opens with the current destination revealed', () => {
		renderDialog({
			initialDestination: 'collection-2' as Id<'collections'>,
		})

		expect(screen.getByRole('button', { name: 'Spanish' })).toHaveAttribute(
			'aria-pressed',
			'true',
		)
		expect(
			screen.queryByRole('button', {
				name: 'Show Spanish in Collections',
			}),
		).not.toBeInTheDocument()
	})

	it('offers to reveal the destination after collapsing all', async () => {
		renderDialog({
			initialDestination: 'collection-2' as Id<'collections'>,
		})
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: 'Collapse all' }))

		expect(
			screen.queryByRole('button', { name: 'Spanish' }),
		).not.toBeInTheDocument()

		await user.click(
			screen.getByRole('button', { name: 'Show Spanish in Collections' }),
		)

		expect(screen.getByRole('button', { name: 'Spanish' })).toHaveFocus()
	})

	it('disables Move when destination has not changed', () => {
		renderDialog()

		expect(screen.getByRole('button', { name: 'Move' })).toBeDisabled()
	})

	it('calls onMove with the selected destination', async () => {
		const { onMove } = renderDialog()
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: 'Science' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(onMove).toHaveBeenCalledWith('collection-3')
	})

	it('shows search results in place of the tree', async () => {
		renderDialog()
		const user = userEvent.setup()

		await user.type(
			screen.getByRole('searchbox', { name: 'Search collections' }),
			's',
		)

		expect(
			await screen.findByRole('list', { name: 'Matching collections' }),
		).toBeInTheDocument()
		expect(screen.getByText('Languages / Spanish')).toBeInTheDocument()
		expect(screen.getByText('Verbs and vocab')).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Collapse all' }),
		).not.toBeInTheDocument()
	})

	it('moves to a destination chosen from the results', async () => {
		const { onMove } = renderDialog()
		const user = userEvent.setup()

		await user.type(
			screen.getByRole('searchbox', { name: 'Search collections' }),
			's',
		)
		await user.click(
			await screen.findByRole('button', {
				name: /^Languages \/ Spanish/,
			}),
		)
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(onMove).toHaveBeenCalledWith('collection-2')
	})

	it('reveals the chosen result once the query is cleared', async () => {
		renderDialog({
			initialDestination: 'collection-3' as Id<'collections'>,
		})
		const user = userEvent.setup()

		await user.type(
			screen.getByRole('searchbox', { name: 'Search collections' }),
			's',
		)
		await user.click(
			await screen.findByRole('button', {
				name: /^Languages \/ Spanish/,
			}),
		)
		await user.click(screen.getByRole('button', { name: 'Clear search' }))

		expect(screen.getByRole('button', { name: 'Spanish' })).toHaveAttribute(
			'aria-pressed',
			'true',
		)
		expect(
			screen.getByRole('searchbox', { name: 'Search collections' }),
		).toHaveFocus()
	})

	it('says when nothing matches', async () => {
		renderDialog()
		const user = userEvent.setup()

		await user.type(
			screen.getByRole('searchbox', { name: 'Search collections' }),
			'astronomy',
		)

		expect(
			await screen.findByText('No collections match “astronomy”'),
		).toBeInTheDocument()
	})

	it('leaves the moved collection and its subtree out of the results', async () => {
		renderRootDialog({
			excludeCollectionId: 'collection-1' as Id<'collections'>,
			initialDestination: null,
		})
		const user = userEvent.setup()

		await user.type(
			screen.getByRole('searchbox', { name: 'Search collections' }),
			's',
		)

		expect(
			await screen.findByRole('button', { name: /^Science/ }),
		).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: /Spanish/ }),
		).not.toBeInTheDocument()
	})

	it('holds back results until the tree can exclude the moved subtree', async () => {
		listState = { data: undefined, isError: false, isPending: true }
		renderRootDialog({
			excludeCollectionId: 'collection-1' as Id<'collections'>,
			initialDestination: null,
		})
		const user = userEvent.setup()

		await user.type(
			screen.getByRole('searchbox', { name: 'Search collections' }),
			's',
		)

		expect(await screen.findByText('Searching…')).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: /Spanish/ }),
		).not.toBeInTheDocument()
	})

	it('keeps a collapse-all when the query is cleared without a pick', async () => {
		renderDialog({
			initialDestination: 'collection-2' as Id<'collections'>,
		})
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: 'Collapse all' }))
		await user.type(
			screen.getByRole('searchbox', { name: 'Search collections' }),
			's',
		)
		await user.click(screen.getByRole('button', { name: 'Clear search' }))

		expect(
			screen.queryByRole('button', { name: 'Spanish' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Show Spanish in Collections' }),
		).toBeInTheDocument()
	})

	it('clears the search on Escape before closing the dialog', async () => {
		const { onOpenChange } = renderDialog()
		const user = userEvent.setup()
		const searchbox = screen.getByRole('searchbox', {
			name: 'Search collections',
		})

		await user.type(searchbox, 's')
		await user.keyboard('{Escape}')

		expect(searchbox).toHaveValue('')
		expect(onOpenChange).not.toHaveBeenCalled()

		await user.keyboard('{Escape}')

		expect(onOpenChange).toHaveBeenCalledWith(false)
	})

	it('disables controls while pending', () => {
		renderDialog({ isPending: true })

		expect(screen.getByRole('button', { name: 'Moving…' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
	})

	it('prevents dismissal while pending', () => {
		const { onOpenChange } = renderDialog({ isPending: true })

		expect(screen.getByRole('dialog')).toBeInTheDocument()

		screen.getByRole('button', { name: 'Close' }).click()

		expect(onOpenChange).not.toHaveBeenCalled()
	})

	it('calls onMove with null when the top level is selected', async () => {
		const { onMove } = renderRootDialog()
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: 'Collections' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(onMove).toHaveBeenCalledWith(null)
	})
})
