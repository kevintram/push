import type { Id } from '@convex/_generated/dataModel'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import type { CollectionWithChildren } from '../../../types/collection.types'
import { LibraryNavigationContent } from '../LibraryNavigationContent'

const STORAGE_KEY = 'libraryNavigationOpen'

const mocks = vi.hoisted(() => ({
	droppableRef: vi.fn<(element: HTMLElement | null) => void>(),
	isDropTarget: false,
	offscreenDirection: undefined as 'above' | 'below' | undefined,
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

// Stands in for the real row, which needs the router and drag and drop. Like
// the real row, it attaches the selected label ref only when it is selected.
vi.mock('../LibraryCollectionItem', () => ({
	LibraryCollectionItem: ({
		_id,
		title,
		selectedLabelRef,
	}: CollectionWithChildren & {
		selectedLabelRef?: (element: HTMLElement | null) => void
	}) => (
		<li>
			<a
				href={`/library/${_id}`}
				ref={_id === 'selected-id' ? selectedLabelRef : undefined}
			>
				{title}
			</a>
		</li>
	),
}))

// Geometry is covered by the hook's own tests.
vi.mock('../useOffscreenDirection', () => ({
	useOffscreenDirection: () => mocks.offscreenDirection,
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

const selectedCollection = makeCollection('selected-id', 'Spanish verbs')

function getRevealPill() {
	return screen.getByRole('button', { name: 'Show Spanish verbs in library' })
}

describe('LibraryNavigationContent', () => {
	beforeEach(() => {
		window.localStorage.clear()
		mocks.droppableRef.mockClear()
		mocks.isDropTarget = false
		mocks.offscreenDirection = undefined
		mocks.useDroppable.mockClear()
	})

	it('keeps the header as the root drop target', () => {
		render(
			<LibraryNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)

		expect(mocks.useDroppable).toHaveBeenCalledWith({ id: 'library-root' })
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
			<LibraryNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: 'Collapse Library' }),
		)
		expect(
			screen.queryByRole('navigation', { name: 'Library collections' }),
		).not.toBeInTheDocument()
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false')

		await user.click(screen.getByRole('button', { name: 'Expand Library' }))
		expect(
			screen.getByRole('navigation', { name: 'Library collections' }),
		).toBeInTheDocument()
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')
	})

	it('restores the collapsed library section preference', () => {
		window.localStorage.setItem(STORAGE_KEY, 'false')

		render(
			<LibraryNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)

		expect(
			screen.getByRole('button', { name: 'Expand Library' }),
		).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('navigation', { name: 'Library collections' }),
		).not.toBeInTheDocument()
	})

	it('keeps collapse-all independent from the Library section', async () => {
		const user = userEvent.setup()
		const onCollapseAll = vi.fn()
		render(
			<LibraryNavigationContent
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
			screen.getByRole('button', { name: 'Collapse Library' }),
		).toHaveAttribute('aria-expanded', 'true')
		expect(
			screen.getByRole('navigation', { name: 'Library collections' }),
		).toBeInTheDocument()
	})

	it('shows tooltips for the library actions', async () => {
		const user = userEvent.setup()
		render(
			<TooltipProvider delay={0}>
				<LibraryNavigationContent
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

	it('adds the top fade only while the collection list is scrolled', () => {
		render(
			<LibraryNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)
		const navigation = screen.getByRole('navigation', {
			name: 'Library collections',
		})
		const restingClassName = navigation.className

		fireEvent.scroll(navigation, { target: { scrollTop: 1 } })
		expect(navigation.className).not.toBe(restingClassName)

		fireEvent.scroll(navigation, { target: { scrollTop: 0 } })
		expect(navigation.className).toBe(restingClassName)
	})

	it('highlights the whole sidebar when the header is the drop target', () => {
		const { rerender } = render(
			<LibraryNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				onRevealSelection={vi.fn()}
			/>,
		)
		const sidebar = screen.getByRole('region', { name: 'Library' })
		const restingClassName = sidebar.className

		mocks.isDropTarget = true
		rerender(
			<LibraryNavigationContent
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
			<LibraryNavigationContent
				collections={[selectedCollection]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				selectedCollection={selectedCollection}
				onRevealSelection={vi.fn()}
			/>,
		)

		expect(
			screen.queryByRole('button', { name: /in library$/ }),
		).not.toBeInTheDocument()
	})

	it('reveals a collapsed selection and focuses its row from the pill', async () => {
		const user = userEvent.setup()
		const onRevealSelection = vi.fn()
		render(
			<LibraryNavigationContent
				collections={[selectedCollection]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				selectedCollection={selectedCollection}
				isSelectionCollapsed
				onRevealSelection={onRevealSelection}
			/>,
		)

		const pill = getRevealPill()
		expect(pill).toHaveTextContent('Spanish verbs')
		expect(pill.querySelector('.lucide-chevrons-up-down')).not.toBeNull()

		await user.click(pill)

		expect(onRevealSelection).toHaveBeenCalledOnce()
		expect(
			screen.getByRole('link', { name: 'Spanish verbs' }),
		).toHaveFocus()
	})

	it.each([
		{ direction: 'above', icon: 'lucide-arrow-up' },
		{ direction: 'below', icon: 'lucide-arrow-down' },
	] as const)(
		'points the pill $direction at a selection scrolled out of view',
		async ({ direction, icon }) => {
			const user = userEvent.setup()
			mocks.offscreenDirection = direction
			render(
				<LibraryNavigationContent
					collections={[selectedCollection]}
					openCollectionIds={new Set()}
					onCollectionOpenChange={vi.fn()}
					onCollapseAll={vi.fn()}
					selectedCollection={selectedCollection}
					onRevealSelection={vi.fn()}
				/>,
			)

			const pill = getRevealPill()
			expect(pill.querySelector(`.${icon}`)).not.toBeNull()

			await user.click(pill)

			expect(
				screen.getByRole('link', { name: 'Spanish verbs' }),
			).toHaveFocus()
		},
	)

	it('treats a collapsed selection as collapsed even when it is also offscreen', () => {
		mocks.offscreenDirection = 'below'
		render(
			<LibraryNavigationContent
				collections={[selectedCollection]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				selectedCollection={selectedCollection}
				isSelectionCollapsed
				onRevealSelection={vi.fn()}
			/>,
		)

		expect(
			getRevealPill().querySelector('.lucide-chevrons-up-down'),
		).not.toBeNull()
	})

	it('labels an untitled hidden selection', () => {
		render(
			<LibraryNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				selectedCollection={makeCollection('selected-id', '  ')}
				isSelectionCollapsed
				onRevealSelection={vi.fn()}
			/>,
		)

		expect(
			screen.getByRole('button', { name: 'Show Untitled in library' }),
		).toBeInTheDocument()
	})

	it('hides the reveal pill while the Library section is collapsed', async () => {
		const user = userEvent.setup()
		render(
			<LibraryNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
				selectedCollection={selectedCollection}
				isSelectionCollapsed
				onRevealSelection={vi.fn()}
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: 'Collapse Library' }),
		)

		expect(
			screen.queryByRole('button', { name: /in library$/ }),
		).not.toBeInTheDocument()
	})
})
