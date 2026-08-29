import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { CollectionWithChildren } from '~/modules/library/types/collection.types'

import { MoveCollectionItem } from '../MoveCollectionItem'

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

describe('MoveCollectionItem', () => {
	it('renders a collection and its children recursively', () => {
		render(
			<ul>
				<MoveCollectionItem
					{...collection('parent', [
						collection('child', [collection('grandchild')]),
					])}
					onSelect={vi.fn()}
					selectedCollectionId={null}
				/>
			</ul>,
		)

		expect(
			screen.getByRole('button', { name: 'parent' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'child' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'grandchild' }),
		).toBeInTheDocument()
	})

	it('collapses and expands while preserving nested state', async () => {
		const user = userEvent.setup()

		render(
			<ul>
				<MoveCollectionItem
					{...collection('parent', [
						collection('child', [collection('grandchild')]),
					])}
					onSelect={vi.fn()}
					selectedCollectionId={'parent' as Id<'collections'>}
				/>
			</ul>,
		)

		await user.click(screen.getByRole('button', { name: 'Collapse child' }))
		await user.click(
			screen.getByRole('button', { name: 'Collapse parent' }),
		)

		expect(
			screen.queryByRole('button', { name: 'child' }),
		).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Expand parent' }))

		expect(
			screen.getByRole('button', { name: 'child' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Expand child' }),
		).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('button', { name: 'grandchild' }),
		).not.toBeInTheDocument()
	})

	it('marks the selected collection with aria-pressed', () => {
		render(
			<ul>
				<MoveCollectionItem
					{...collection('parent', [collection('child')])}
					onSelect={vi.fn()}
					selectedCollectionId={'child' as Id<'collections'>}
				/>
			</ul>,
		)

		expect(screen.getByRole('button', { name: 'parent' })).toHaveAttribute(
			'aria-pressed',
			'false',
		)
		expect(screen.getByRole('button', { name: 'child' })).toHaveAttribute(
			'aria-pressed',
			'true',
		)
	})

	it('calls onSelect with the collection ID when clicked', async () => {
		const onSelect = vi.fn()

		render(
			<ul>
				<MoveCollectionItem
					{...collection('parent', [collection('child')])}
					onSelect={onSelect}
					selectedCollectionId={null}
				/>
			</ul>,
		)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'child' }))

		expect(onSelect).toHaveBeenCalledWith('child')
	})

	it('renders untitled collections with a fallback label', () => {
		render(
			<ul>
				<MoveCollectionItem
					{...collection('id')}
					title='   '
					onSelect={vi.fn()}
					selectedCollectionId={null}
				/>
			</ul>,
		)

		expect(
			screen.getByRole('button', { name: 'Untitled' }),
		).toBeInTheDocument()
	})
})
