import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { CollectionWithChildren } from '~/modules/library/types/collection.types'

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

describe('MoveCollectionTree', () => {
	it('renders collections as a selectable tree', async () => {
		const user = userEvent.setup()

		render(
			<MoveCollectionTree
				onSelect={vi.fn()}
				selectedDestination={null}
				collections={[
					collection('A', [collection('B')]),
					collection('C'),
				]}
			/>,
		)

		expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'C' })).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Toggle A' }))

		expect(screen.getByRole('button', { name: 'B' })).toBeInTheDocument()
	})

	it('renders a selectable Library root when allowLibraryRoot is true', () => {
		render(
			<MoveCollectionTree
				allowLibraryRoot
				onSelect={vi.fn()}
				selectedDestination={null}
				collections={[collection('A')]}
			/>,
		)

		expect(
			screen.getByRole('button', { name: 'Library' }),
		).toBeInTheDocument()
	})

	it('does not render Library root by default', () => {
		render(
			<MoveCollectionTree
				onSelect={vi.fn()}
				selectedDestination={null}
				collections={[collection('A')]}
			/>,
		)

		expect(
			screen.queryByRole('button', { name: 'Library' }),
		).not.toBeInTheDocument()
	})

	it('calls onSelect with null when Library root is clicked', async () => {
		const onSelect = vi.fn()

		render(
			<MoveCollectionTree
				allowLibraryRoot
				onSelect={onSelect}
				selectedDestination={'A' as Id<'collections'>}
				collections={[collection('A')]}
			/>,
		)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Library' }))

		expect(onSelect).toHaveBeenCalledWith(null)
	})

	it('marks the Library root as selected when destination is null', () => {
		render(
			<MoveCollectionTree
				allowLibraryRoot
				onSelect={vi.fn()}
				selectedDestination={null}
				collections={[collection('A')]}
			/>,
		)

		expect(screen.getByRole('button', { name: 'Library' })).toHaveAttribute(
			'aria-pressed',
			'true',
		)
	})

	it('excludes the specified collection and its entire subtree', async () => {
		const user = userEvent.setup()

		render(
			<MoveCollectionTree
				excludeCollectionId={'B' as Id<'collections'>}
				onSelect={vi.fn()}
				selectedDestination={null}
				collections={[
					collection('A', [
						collection('B', [collection('B-child')]),
						collection('C'),
					]),
				]}
			/>,
		)

		expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Toggle A' }))

		expect(screen.getByRole('button', { name: 'C' })).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'B' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'B-child' }),
		).not.toBeInTheDocument()
	})

	it('excludes a root-level collection and its subtree', () => {
		render(
			<MoveCollectionTree
				excludeCollectionId={'A' as Id<'collections'>}
				onSelect={vi.fn()}
				selectedDestination={null}
				collections={[
					collection('A', [collection('A-child')]),
					collection('B'),
				]}
			/>,
		)

		expect(screen.getByRole('button', { name: 'B' })).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'A' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'A-child' }),
		).not.toBeInTheDocument()
	})

	it('leaves unrelated branches available when excluding a subtree', async () => {
		const user = userEvent.setup()

		render(
			<MoveCollectionTree
				excludeCollectionId={'B' as Id<'collections'>}
				onSelect={vi.fn()}
				selectedDestination={null}
				collections={[
					collection('A', [collection('B'), collection('C')]),
					collection('D', [collection('E')]),
				]}
			/>,
		)

		for (const name of ['A', 'D']) {
			expect(screen.getByRole('button', { name })).toBeInTheDocument()
		}

		await user.click(screen.getByRole('button', { name: 'Toggle A' }))
		await user.click(screen.getByRole('button', { name: 'Toggle D' }))

		expect(screen.getByRole('button', { name: 'C' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'E' })).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'B' }),
		).not.toBeInTheDocument()
	})
})
