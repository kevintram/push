import type { Id } from '@convex/_generated/dataModel'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { cloneElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectionWithChildren } from '../../../types/collection.types'
import { CollectionTreeItem } from '../CollectionTreeItem'

const mocks = vi.hoisted(() => ({
	activeCollectionId: undefined as string | undefined,
	onCollectionOpenChange: vi.fn(),
}))

vi.mock('@dnd-kit/react', () => ({
	useDraggable: () => ({
		ref: vi.fn(),
		handleRef: vi.fn(),
		isDragging: false,
	}),
	useDroppable: () => ({ ref: vi.fn(), isDropTarget: false }),
}))

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, ...props }: { children?: ReactNode }) => (
		<a {...props}>{children}</a>
	),
	useMatchRoute:
		() =>
		({ params }: { params: { collectionId: string } }) =>
			params.collectionId === mocks.activeCollectionId,
	useNavigate: () => vi.fn(),
}))

vi.mock('~/components/ui', async importOriginal => {
	const actual = await importOriginal<typeof import('~/components/ui')>()

	return {
		...actual,
		ContextMenu: ({ children }: { children: ReactNode }) => children,
		ContextMenuContent: () => null,
		ContextMenuTrigger: ({
			children,
			render: trigger,
		}: {
			children: ReactNode
			render: ReactElement<{ children?: ReactNode }>
		}) => cloneElement(trigger, {}, children),
	}
})

vi.mock('../../../api/collectionQueries', () => ({
	useCreateCollection: () => ({ mutate: vi.fn() }),
	useDeleteCollection: () => ({ mutate: vi.fn() }),
}))

vi.mock('../../MoveCollectionDialog', () => ({
	MoveCollectionDialog: () => null,
}))

function collection(
	id: string,
	childCollections: Array<CollectionWithChildren> = [],
): CollectionWithChildren {
	return {
		_id: id as Id<'collections'>,
		_creationTime: 0,
		title: id,
		description: '',
		ownerId: 'owner',
		path: [],
		searchText: id,
		childCollections,
	}
}

function renderItem(
	props: CollectionWithChildren,
	openIds: Array<string> = [],
) {
	render(
		<ul>
			<CollectionTreeItem
				{...props}
				openCollectionIds={new Set(openIds as Array<Id<'collections'>>)}
				onCollectionOpenChange={mocks.onCollectionOpenChange}
			/>
		</ul>,
	)
}

/** Clicks the label and returns whether the link's navigation was kept. */
function clickLabel(name: string, init?: MouseEventInit) {
	return fireEvent.click(screen.getByLabelText(name), init)
}

describe('CollectionTreeItem label click', () => {
	beforeEach(() => {
		mocks.activeCollectionId = undefined
		mocks.onCollectionOpenChange.mockClear()
	})

	it('opens the selected collection when it is closed', () => {
		mocks.activeCollectionId = 'parent'
		renderItem(collection('parent', [collection('child')]))

		expect(clickLabel('parent')).toBe(false)
		expect(mocks.onCollectionOpenChange).toHaveBeenCalledWith(
			'parent',
			true,
		)
	})

	it('closes the selected collection when it is open', () => {
		mocks.activeCollectionId = 'parent'
		renderItem(collection('parent', [collection('child')]), ['parent'])

		expect(clickLabel('parent')).toBe(false)
		expect(mocks.onCollectionOpenChange).toHaveBeenCalledWith(
			'parent',
			false,
		)
	})

	it('navigates when the collection is not selected', () => {
		renderItem(collection('parent', [collection('child')]))

		expect(clickLabel('parent')).toBe(true)
		expect(mocks.onCollectionOpenChange).not.toHaveBeenCalled()
	})

	it('does nothing extra when the selected collection has no children', () => {
		mocks.activeCollectionId = 'leaf'
		renderItem(collection('leaf'))

		expect(clickLabel('leaf')).toBe(true)
		expect(mocks.onCollectionOpenChange).not.toHaveBeenCalled()
	})

	it.each([
		{ name: 'meta', init: { metaKey: true } },
		{ name: 'ctrl', init: { ctrlKey: true } },
		{ name: 'shift', init: { shiftKey: true } },
		{ name: 'alt', init: { altKey: true } },
		{ name: 'middle-button', init: { button: 1 } },
	])('keeps the link behavior for a $name click', ({ init }) => {
		mocks.activeCollectionId = 'parent'
		renderItem(collection('parent', [collection('child')]))

		expect(clickLabel('parent', init)).toBe(true)
		expect(mocks.onCollectionOpenChange).not.toHaveBeenCalled()
	})
})
