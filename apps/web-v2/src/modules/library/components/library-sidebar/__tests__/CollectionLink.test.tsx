import type { Id } from '@convex/_generated/dataModel'
import { PointerActivationConstraints } from '@dnd-kit/dom'
import { render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { cloneElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectionWithChildren } from '../../../types/collection.types'
import { LibraryCollectionItem } from '../LibraryCollectionItem'

type DraggableInput = {
	id: string
	sensors?: Array<{
		options?: {
			activationConstraints?: (event: PointerEvent) => Array<unknown>
		}
	}>
}

type DroppableInput = {
	disabled?: boolean
	id: string
}

const dnd = vi.hoisted(() => ({
	draggableInputs: [] as Array<DraggableInput>,
	draggingIds: new Set<string>(),
	droppableInputs: [] as Array<DroppableInput>,
	dropTargetIds: new Set<string>(),
}))

vi.mock('@dnd-kit/react', () => ({
	useDraggable: (input: DraggableInput) => {
		dnd.draggableInputs.push(input)
		return {
			ref: vi.fn(),
			handleRef: vi.fn(),
			isDragging: dnd.draggingIds.has(input.id),
		}
	},
	useDroppable: (input: DroppableInput) => {
		dnd.droppableInputs.push(input)
		return {
			ref: vi.fn(),
			isDropTarget: dnd.dropTargetIds.has(input.id),
		}
	},
}))

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, ...props }: { children?: ReactNode }) => (
		<a {...props}>{children}</a>
	),
	useMatchRoute: () => () => false,
	useNavigate: () => vi.fn(),
}))

vi.mock('~/components/ui', async importOriginal => {
	const actual = await importOriginal<typeof import('~/components/ui')>()

	return {
		...actual,
		Button: {
			Icon: ({
				children,
				shape: _shape,
				size: _size,
				variant: _variant,
				...props
			}: {
				children?: ReactNode
				shape?: string
				size?: string
				variant?: string
			}) => <button {...props}>{children}</button>,
		},
		ContextMenu: ({ children }: { children: ReactNode }) => children,
		ContextMenuContent: ({ children }: { children: ReactNode }) => children,
		ContextMenuItem: ({ children }: { children: ReactNode }) => (
			<div>{children}</div>
		),
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

const closedCollectionIds = new Set<Id<'collections'>>()

function TestLibraryCollectionItem(
	props: CollectionWithChildren & { dropDisabled?: boolean },
) {
	return (
		<LibraryCollectionItem
			{...props}
			openCollectionIds={closedCollectionIds}
			onCollectionOpenChange={() => {}}
		/>
	)
}

function disabledByCollection() {
	return Object.fromEntries(
		dnd.droppableInputs.map(({ disabled, id }) => [id, disabled ?? false]),
	)
}

describe('CollectionLink drag and drop', () => {
	beforeEach(() => {
		dnd.draggableInputs.length = 0
		dnd.droppableInputs.length = 0
		dnd.draggingIds.clear()
		dnd.dropTargetIds.clear()
	})

	it('registers every collection as a draggable and drop target using its collection ID', () => {
		render(
			<TestLibraryCollectionItem
				{...collection('parent', [collection('child')])}
			/>,
		)

		expect(dnd.draggableInputs.map(({ id }) => id)).toEqual([
			'parent',
			'child',
		])
		expect(dnd.droppableInputs.map(({ id }) => id)).toEqual([
			'parent',
			'child',
		])
	})

	it('disables the dragged collection and all descendant drop targets', () => {
		dnd.draggingIds.add('parent')

		render(
			<ul>
				<TestLibraryCollectionItem
					{...collection('parent', [
						collection('child', [collection('grandchild')]),
					])}
				/>
				<TestLibraryCollectionItem {...collection('sibling')} />
			</ul>,
		)

		expect(disabledByCollection()).toEqual({
			parent: true,
			child: true,
			grandchild: true,
			sibling: false,
		})
	})

	it('propagates an inherited disabled state through the entire subtree', () => {
		render(
			<TestLibraryCollectionItem
				{...collection('parent', [
					collection('child', [collection('grandchild')]),
				])}
				dropDisabled
			/>,
		)

		expect(disabledByCollection()).toEqual({
			parent: true,
			child: true,
			grandchild: true,
		})
	})

	it('applies a visual state while a collection is being dragged', () => {
		const rendered = render(
			<TestLibraryCollectionItem {...collection('collection')} />,
		)
		const defaultClassName = screen.getByRole('listitem').className

		dnd.draggingIds.add('collection')
		rendered.rerender(
			<TestLibraryCollectionItem {...collection('collection')} />,
		)

		expect(screen.getByRole('listitem').className).not.toBe(
			defaultClassName,
		)
	})

	it('applies a visual state while a collection is the active drop target', () => {
		const rendered = render(
			<TestLibraryCollectionItem {...collection('collection')} />,
		)
		const defaultClassName = screen.getByRole('listitem').className

		dnd.dropTargetIds.add('collection')
		rendered.rerender(
			<TestLibraryCollectionItem {...collection('collection')} />,
		)

		expect(screen.getByRole('listitem').className).not.toBe(
			defaultClassName,
		)
	})

	it('requires pointer movement before activating mouse and pen drags', () => {
		render(<TestLibraryCollectionItem {...collection('collection')} />)
		const sensor = dnd.draggableInputs[0]?.sensors?.[0]
		const activate = sensor?.options?.activationConstraints

		const mouseConstraints = activate?.({
			pointerType: 'mouse',
		} as PointerEvent) as Array<{ options: unknown }>
		const penConstraints = activate?.({
			pointerType: 'pen',
		} as PointerEvent) as Array<{ options: unknown }>

		expect(mouseConstraints).toHaveLength(1)
		expect(mouseConstraints[0]).toBeInstanceOf(
			PointerActivationConstraints.Distance,
		)
		expect(mouseConstraints[0]?.options).toEqual({ value: 6 })
		expect(penConstraints[0]).toBeInstanceOf(
			PointerActivationConstraints.Distance,
		)
		expect(penConstraints[0]?.options).toEqual({ value: 6 })
	})

	it('uses a delay and movement tolerance before activating touch drags', () => {
		render(<TestLibraryCollectionItem {...collection('collection')} />)
		const sensor = dnd.draggableInputs[0]?.sensors?.[0]
		const activate = sensor?.options?.activationConstraints

		const constraints = activate?.({
			pointerType: 'touch',
		} as PointerEvent) as Array<{ options: unknown }>

		expect(constraints).toHaveLength(1)
		expect(constraints[0]).toBeInstanceOf(
			PointerActivationConstraints.Delay,
		)
		expect(constraints[0]?.options).toEqual({ value: 250, tolerance: 5 })
	})

	it('exposes a Move action in the context menu', () => {
		render(<TestLibraryCollectionItem {...collection('collection')} />)

		expect(screen.getByText('Move')).toBeInTheDocument()
	})
})
