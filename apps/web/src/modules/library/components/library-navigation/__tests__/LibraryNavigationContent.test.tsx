import type { Id } from '@convex/_generated/dataModel'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import { LibraryNavigationContent } from '../LibraryNavigationContent'

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

describe('LibraryNavigationContent', () => {
	beforeEach(() => {
		mocks.droppableRef.mockClear()
		mocks.isDropTarget = false
		mocks.useDroppable.mockClear()
	})

	it('keeps the header as the root drop target', () => {
		render(
			<LibraryNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
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
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: 'Collapse Library' }),
		)
		expect(
			screen.queryByRole('navigation', { name: 'Library collections' }),
		).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Expand Library' }))
		expect(
			screen.getByRole('navigation', { name: 'Library collections' }),
		).toBeInTheDocument()
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
			/>,
		)
		const sidebar = screen.getByRole('navigation').parentElement
		const restingClassName = sidebar?.className

		mocks.isDropTarget = true
		rerender(
			<LibraryNavigationContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
			/>,
		)

		expect(sidebar?.className).not.toBe(restingClassName)
	})
})
