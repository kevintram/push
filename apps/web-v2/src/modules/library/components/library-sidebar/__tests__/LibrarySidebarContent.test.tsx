import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LibrarySidebarContent } from '../LibrarySidebarContent'

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

describe('LibrarySidebarContent', () => {
	beforeEach(() => {
		mocks.droppableRef.mockClear()
		mocks.isDropTarget = false
		mocks.useDroppable.mockClear()
	})

	it('keeps the header as the root drop target', () => {
		render(
			<LibrarySidebarContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
			/>,
		)

		expect(mocks.useDroppable).toHaveBeenCalledWith({ id: 'library-root' })
		expect(mocks.droppableRef).toHaveBeenCalledWith(
			screen.getByText('Library').parentElement,
		)
	})

	it('highlights the whole sidebar when the header is the drop target', () => {
		const { rerender } = render(
			<LibrarySidebarContent
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
			<LibrarySidebarContent
				collections={[]}
				openCollectionIds={new Set()}
				onCollectionOpenChange={vi.fn()}
				onCollapseAll={vi.fn()}
			/>,
		)

		expect(sidebar?.className).not.toBe(restingClassName)
	})
})
