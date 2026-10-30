import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { CollectionWithChildren } from '~/modules/collections/types/collection.types'

import { MoveCollectionTree } from '../MoveCollectionTree'

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

type TreeProps = React.ComponentProps<typeof MoveCollectionTree>

function renderTree(overrides: Partial<TreeProps> = {}) {
	const props = {
		collections: [collection('A', [collection('B')]), collection('C')],
		onCollapseAll: vi.fn(),
		onCollectionOpenChange: vi.fn(),
		onSelect: vi.fn(),
		openCollectionIds: new Set<Id<'collections'>>(),
		selectedDestination: null,
		...overrides,
	} satisfies TreeProps
	render(<MoveCollectionTree {...props} />)
	return props
}

describe('MoveCollectionTree', () => {
	it('renders collections as a selectable tree', () => {
		renderTree({ openCollectionIds: new Set(['A' as Id<'collections'>]) })

		for (const name of ['A', 'B', 'C']) {
			expect(screen.getByRole('button', { name })).toBeInTheDocument()
		}
	})

	it('reports branch toggles to its owner', async () => {
		const { onCollectionOpenChange } = renderTree()

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Toggle A' }))

		expect(onCollectionOpenChange).toHaveBeenCalledWith('A', true)
	})

	it('labels the tree without offering the top level by default', () => {
		renderTree()

		expect(screen.getByText('Collections')).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Collections' }),
		).not.toBeInTheDocument()
	})

	it('offers the top level when allowRoot is true', async () => {
		const { onSelect } = renderTree({
			allowRoot: true,
			selectedDestination: 'A' as Id<'collections'>,
		})

		const root = screen.getByRole('button', { name: 'Collections' })
		expect(root).toHaveAttribute('aria-pressed', 'false')

		await userEvent.setup().click(root)

		expect(onSelect).toHaveBeenCalledWith(null)
	})

	it('marks the top level as selected when destination is null', () => {
		renderTree({ allowRoot: true, selectedDestination: null })

		expect(
			screen.getByRole('button', { name: 'Collections' }),
		).toHaveAttribute('aria-pressed', 'true')
	})

	it('disables Collapse all while every branch is closed', () => {
		renderTree()

		expect(
			screen.getByRole('button', { name: 'Collapse all' }),
		).toBeDisabled()
	})

	it('collapses all open branches', async () => {
		const { onCollapseAll } = renderTree({
			openCollectionIds: new Set(['A' as Id<'collections'>]),
		})

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Collapse all' }))

		expect(onCollapseAll).toHaveBeenCalled()
	})
})
