import { act, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CollectionsNavigation } from '../CollectionsNavigation'

type TestDragEndEvent = {
	canceled: boolean
	operation: {
		source?: { id?: string } | null
		target?: { id?: string } | null
	}
}

const mocks = vi.hoisted(() => ({
	onDragEnd: undefined as ((event: TestDragEndEvent) => void) | undefined,
	updateCollection: vi.fn(),
}))

vi.mock('@dnd-kit/react', () => ({
	DragDropProvider: ({
		children,
		onDragEnd,
	}: {
		children: ReactNode
		onDragEnd: (event: TestDragEndEvent) => void
	}) => {
		mocks.onDragEnd = onDragEnd
		return children
	},
	DragOverlay: () => null,
}))

vi.mock('@tanstack/react-query', () => ({
	useQuery: () => ({ data: [] }),
}))

vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ collectionId: undefined }),
}))

vi.mock('../../../api/collectionQueries', () => ({
	collectionQueries: { list: () => ({}) },
	useUpdateCollection: () => ({ mutate: mocks.updateCollection }),
}))

vi.mock('../CollectionsNavigationContent', () => ({
	CollectionsNavigationContent: () => <div>Collections sidebar content</div>,
}))

function finishDrag(event: TestDragEndEvent) {
	act(() => mocks.onDragEnd?.(event))
}

describe('CollectionsNavigation drag and drop', () => {
	beforeEach(() => {
		window.localStorage.clear()
		mocks.onDragEnd = undefined
		mocks.updateCollection.mockClear()
	})

	it('reparents a collection when dropped onto another collection', () => {
		render(<CollectionsNavigation />)

		finishDrag({
			canceled: false,
			operation: {
				source: { id: 'source-collection' },
				target: { id: 'parent-collection' },
			},
		})

		expect(mocks.updateCollection).toHaveBeenCalledWith({
			collectionId: 'source-collection',
			parentId: 'parent-collection',
		})
	})

	it('moves a collection to the root when dropped onto the Collections header', () => {
		render(<CollectionsNavigation />)

		finishDrag({
			canceled: false,
			operation: {
				source: { id: 'source-collection' },
				target: { id: 'collections-root' },
			},
		})

		expect(mocks.updateCollection).toHaveBeenCalledWith({
			collectionId: 'source-collection',
			parentId: null,
		})
	})

	it.each([
		{
			name: 'the drag was canceled',
			event: {
				canceled: true,
				operation: {
					source: { id: 'source-collection' },
					target: { id: 'parent-collection' },
				},
			},
		},
		{
			name: 'the source is missing',
			event: {
				canceled: false,
				operation: { target: { id: 'parent-collection' } },
			},
		},
		{
			name: 'the target is missing',
			event: {
				canceled: false,
				operation: { source: { id: 'source-collection' } },
			},
		},
		{
			name: 'the source and target are the same collection',
			event: {
				canceled: false,
				operation: {
					source: { id: 'same-collection' },
					target: { id: 'same-collection' },
				},
			},
		},
	])('does not update a collection when $name', ({ event }) => {
		render(<CollectionsNavigation />)

		finishDrag(event)

		expect(mocks.updateCollection).not.toHaveBeenCalled()
	})
})
