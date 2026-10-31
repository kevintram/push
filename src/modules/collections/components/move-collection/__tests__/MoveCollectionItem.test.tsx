import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { useOpenCollectionIds } from '~/modules/collections/hooks/useOpenCollectionIds'
import type { CollectionWithChildren } from '~/modules/collections/types/collection.types'

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

type ItemProps = React.ComponentProps<typeof MoveCollectionItem>

// Owns the open branches the way the dialog does.
function ControlledItem(
	props: Omit<ItemProps, 'openCollectionIds' | 'onCollectionOpenChange'>,
) {
	const { openCollectionIds, setCollectionOpen } = useOpenCollectionIds(
		() => new Set(),
	)
	return (
		<ul>
			<MoveCollectionItem
				{...props}
				openCollectionIds={openCollectionIds}
				onCollectionOpenChange={setCollectionOpen}
			/>
		</ul>
	)
}

describe('MoveCollectionItem', () => {
	it('renders a collection and its children recursively', async () => {
		const user = userEvent.setup()

		render(
			<ControlledItem
				{...collection('parent', [
					collection('child', [collection('grandchild')]),
				])}
				onSelect={vi.fn()}
				selectedCollectionId={null}
			/>,
		)

		expect(
			screen.getByRole('button', { name: 'parent' }),
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Toggle parent' }))

		expect(
			screen.getByRole('button', { name: 'child' }),
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Toggle child' }))

		expect(
			screen.getByRole('button', { name: 'grandchild' }),
		).toBeInTheDocument()
	})

	it('collapses and expands while preserving nested state', async () => {
		const user = userEvent.setup()

		render(
			<ControlledItem
				{...collection('parent', [
					collection('child', [collection('grandchild')]),
				])}
				onSelect={vi.fn()}
				selectedCollectionId={'parent' as Id<'collections'>}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Toggle parent' }))
		await user.click(screen.getByRole('button', { name: 'Toggle child' }))
		await user.click(screen.getByRole('button', { name: 'Toggle child' }))
		await user.click(screen.getByRole('button', { name: 'Toggle parent' }))

		expect(
			screen.queryByRole('button', { name: 'child' }),
		).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Toggle parent' }))

		expect(
			screen.getByRole('button', { name: 'child' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Toggle child' }),
		).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('button', { name: 'grandchild' }),
		).not.toBeInTheDocument()
	})

	it('opens the branches it is given', () => {
		render(
			<ul>
				<MoveCollectionItem
					{...collection('parent', [collection('child')])}
					onSelect={vi.fn()}
					selectedCollectionId={null}
					openCollectionIds={new Set(['parent' as Id<'collections'>])}
					onCollectionOpenChange={vi.fn()}
				/>
			</ul>,
		)

		expect(
			screen.getByRole('button', { name: 'child' }),
		).toBeInTheDocument()
	})

	it('marks the selected collection with aria-pressed', async () => {
		const user = userEvent.setup()

		render(
			<ControlledItem
				{...collection('parent', [collection('child')])}
				onSelect={vi.fn()}
				selectedCollectionId={'child' as Id<'collections'>}
			/>,
		)

		expect(screen.getByRole('button', { name: 'parent' })).toHaveAttribute(
			'aria-pressed',
			'false',
		)

		await user.click(screen.getByRole('button', { name: 'Toggle parent' }))

		expect(screen.getByRole('button', { name: 'child' })).toHaveAttribute(
			'aria-pressed',
			'true',
		)
	})

	it('calls onSelect with the collection ID when clicked', async () => {
		const onSelect = vi.fn()
		const user = userEvent.setup()

		render(
			<ControlledItem
				{...collection('parent', [collection('child')])}
				onSelect={onSelect}
				selectedCollectionId={null}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Toggle parent' }))
		await user.click(screen.getByRole('button', { name: 'child' }))

		expect(onSelect).toHaveBeenCalledWith('child')
	})

	it('renders untitled collections with a fallback label', () => {
		render(
			<ControlledItem
				{...collection('id')}
				title='   '
				onSelect={vi.fn()}
				selectedCollectionId={null}
			/>,
		)

		expect(
			screen.getByRole('button', { name: 'Untitled' }),
		).toBeInTheDocument()
	})
})
