import type { Id } from '@convex/_generated/dataModel'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import type { CollectionWithChildren } from '../../../types/collection.types'
import { CollectionsNavigationContent } from '../CollectionsNavigationContent'

const STORAGE_KEY = 'collectionsNavigationOpen'

const mocks = vi.hoisted(() => ({
	droppableRef: vi.fn<(element: HTMLElement | null) => void>(),
	isDropTarget: false,
	useDroppable: vi.fn(),
}))

vi.mock('@dnd-kit/react', () => ({
	useDroppable: (input: { id: string }) => {
		mocks.useDroppable(input)
		return {
			ref: mocks.droppableRef,
			isDropTarget: mocks.isDropTarget,
		}
	},
}))

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => vi.fn(),
}))

vi.mock('../../../api/collectionQueries', () => ({
	useCreateCollection: () => ({ mutate: vi.fn() }),
}))

// Stands in for the real row, which needs the router and drag and drop. The
// selected row's link is marked the way the router marks the active link.
vi.mock('../CollectionTreeItem', () => ({
	CollectionTreeItem: ({ _id, title }: CollectionWithChildren) => (
		<li>
			<a
				href={`/collection/${_id}`}
				aria-current={_id === 'selected-id' ? 'page' : undefined}
			>
				{title}
			</a>
		</li>
	),
}))

function makeCollection(id: string, title: string): CollectionWithChildren {
	return {
		_id: id as Id<'collections'>,
		_creationTime: 0,
		title,
		description: '',
		ownerId: 'owner',
		searchText: title,
		path: [],
		childCollections: [],
	}
}

const hiddenSelection = makeCollection('selected-id', 'Spanish verbs')

describe('CollectionsNavigationContent', () => {
	beforeEach(() => {
		window.localStorage.clear()
		mocks.droppableRef.mockClear()
		mocks.isDropTarget = false
		mocks.useDroppable.mockClear()
	})

	it('keeps the header as the root drop target', () => {
		render(
			<CollectionsNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)

		expect(mocks.useDroppable).toHaveBeenCalledWith({
			id: 'collections-root',
		})
		const dropTarget = mocks.droppableRef.mock.calls.at(-1)?.[0]
		expect(dropTarget).toContainElement(
			screen.getByRole('button', { name: 'Collapse all' }),
		)
		expect(dropTarget).toContainElement(
			screen.getByRole('button', { name: 'Add collection' }),
		)
	})

	it('collapses and expands the collection list from its section header', async () => {
		const user = userEvent.setup()
		render(
			<CollectionsNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: 'Collapse Collections' }),
		)
		expect(
			screen.queryByRole('navigation', { name: 'Collection tree' }),
		).not.toBeInTheDocument()
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false')

		await user.click(
			screen.getByRole('button', { name: 'Expand Collections' }),
		)
		expect(
			screen.getByRole('navigation', { name: 'Collection tree' }),
		).toBeInTheDocument()
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')
	})

	it('restores the collapsed Collections section preference', () => {
		window.localStorage.setItem(STORAGE_KEY, 'false')

		render(
			<CollectionsNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)

		expect(
			screen.getByRole('button', { name: 'Expand Collections' }),
		).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('navigation', { name: 'Collection tree' }),
		).not.toBeInTheDocument()
	})

	it('keeps collapse-all independent from the Collections section', async () => {
		const user = userEvent.setup()
		const onCollapseAll = vi.fn()
		render(
			<CollectionsNavigationContent
				collections={[]}
				openCollectionIds={
					new Set(['collection-id' as Id<'collections'>])
				}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={onCollapseAll}
				onRevealSelection={vi.fn()}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Collapse all' }))
		expect(onCollapseAll).toHaveBeenCalledOnce()
		expect(
			screen.getByRole('button', { name: 'Collapse Collections' }),
		).toHaveAttribute('aria-expanded', 'true')
		expect(
			screen.getByRole('navigation', { name: 'Collection tree' }),
		).toBeInTheDocument()
	})

	it('shows tooltips for the Collections actions', async () => {
		const user = userEvent.setup()
		render(
			<TooltipProvider delay={0}>
				<CollectionsNavigationContent
					collections={[]}
					openCollectionIds={
						new Set(['collection-id' as Id<'collections'>])
					}
					onCollectionOpenChange={vi.fn()}
					onCollapseAll={vi.fn()}
					onRevealSelection={vi.fn()}
				/>
			</TooltipProvider>,
		)

		const collapseButton = screen.getByRole('button', {
			name: 'Collapse all',
		})
		await user.hover(collapseButton)
		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'Collapse all',
		)

		await user.unhover(collapseButton)
		await user.hover(screen.getByRole('button', { name: 'Add collection' }))
		await waitFor(() =>
			expect(screen.getByRole('tooltip')).toHaveTextContent(
				'Add collection',
			),
		)
	})

	it('highlights the whole sidebar when the header is the drop target', () => {
		const { rerender } = render(
			<CollectionsNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)
		const sidebar = screen.getByRole('region', { name: 'Collections' })
		const restingClassName = sidebar.className

		mocks.isDropTarget = true
		rerender(
			<CollectionsNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)

		expect(sidebar.className).not.toBe(restingClassName)
	})

	it('shows no reveal pill while the selection is visible', () => {
		render(
			<CollectionsNavigationContent
				collections={[hiddenSelection]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)

		expect(
			screen.queryByRole('button', { name: /in collections$/ }),
		).not.toBeInTheDocument()
	})

	it('reveals the hidden selection and focuses its row from the pill', async () => {
		const user = userEvent.setup()
		const onRevealSelection = vi.fn()
		render(
			<CollectionsNavigationContent
				collections={[hiddenSelection]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				hiddenSelection={hiddenSelection}
				onRevealSelection={onRevealSelection}
			/>,
		)

		const pill = screen.getByRole('button', {
			name: 'Show Spanish verbs in collections',
		})
		expect(pill).toHaveTextContent('Spanish verbs')

		await user.click(pill)

		expect(onRevealSelection).toHaveBeenCalledOnce()
		expect(
			screen.getByRole('link', { name: 'Spanish verbs' }),
		).toHaveFocus()
	})

	it('labels an untitled hidden selection', () => {
		render(
			<CollectionsNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				hiddenSelection={makeCollection('selected-id', '  ')}
				onRevealSelection={vi.fn()}
			/>,
		)

		expect(
			screen.getByRole('button', {
				name: 'Show Untitled in collections',
			}),
		).toBeInTheDocument()
	})

	it('hides the reveal pill while the Collections section is collapsed', async () => {
		const user = userEvent.setup()
		render(
			<CollectionsNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				hiddenSelection={hiddenSelection}
				onRevealSelection={vi.fn()}
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: 'Collapse Collections' }),
		)

		expect(
			screen.queryByRole('button', { name: /in collections$/ }),
		).not.toBeInTheDocument()
	})
})
