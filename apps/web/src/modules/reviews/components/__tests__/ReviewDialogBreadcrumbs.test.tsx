import type { Id } from '@convex/_generated/dataModel'
import type {
	Collection,
	CollectionDetail,
} from '@convex/validators/collections'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Dialog } from '~/components/ui'

import { ReviewDialogBreadcrumbs } from '../ReviewDialogBreadcrumbs'

vi.mock('@tanstack/react-router', () => ({
	Link: ({
		children,
		params: _params,
		to,
		...props
	}: {
		children?: ReactNode
		params?: unknown
		to?: string
	}) => (
		<a href={to ?? '#'} {...props}>
			{children}
		</a>
	),
}))

function collection(id: string, title = id): Collection {
	return {
		_id: id as Id<'collections'>,
		_creationTime: 0,
		title,
		description: '',
		ownerId: 'owner',
		path: [],
		searchText: title,
	}
}

function collectionDetail(collections: Array<Collection>): CollectionDetail {
	const current = collection(collections.at(-1)?._id ?? 'current')
	return { ...current, path: collections.slice(0, -1) }
}

function renderBreadcrumbs(
	collection: CollectionDetail,
	onOpenChange = vi.fn(),
) {
	return render(
		<Dialog open onOpenChange={onOpenChange}>
			<ReviewDialogBreadcrumbs
				card={undefined}
				cardId={'card' as Id<'cards'>}
				collection={collection}
			/>
		</Dialog>,
	)
}

describe('ReviewDialogBreadcrumbs', () => {
	it('keeps one collection visible when the complete trail fits', () => {
		const breadcrumb = renderBreadcrumbs(
			collectionDetail([collection('collection')]),
		)

		expect(
			screen.getByRole('button', { name: 'collection' }),
		).toBeInTheDocument()
		expect(
			within(
				screen.getByRole('navigation', { name: 'Review location' }),
			).queryByRole('button', { name: 'Show collection path' }),
		).not.toBeInTheDocument()
		breadcrumb.unmount()
	})

	it('keeps two collections visible when the complete trail fits', () => {
		renderBreadcrumbs(
			collectionDetail([
				collection('ancestor'),
				collection('collection'),
			]),
		)

		const navigation = screen.getByRole('navigation', {
			name: 'Review location',
		})
		expect(
			within(navigation).getByRole('button', { name: 'ancestor' }),
		).toBeInTheDocument()
		expect(
			within(navigation).queryByRole('button', {
				name: 'Show collection path',
			}),
		).not.toBeInTheDocument()
	})

	it('moves all collections into a purpose-specific overflow menu', () => {
		renderBreadcrumbs(
			collectionDetail([
				collection('root'),
				collection('ancestor'),
				collection('collection'),
			]),
		)

		const navigation = screen.getByRole('navigation', {
			name: 'Review location',
		})
		expect(
			within(navigation).getByRole('button', { name: 'Card' }),
		).toBeInTheDocument()
		expect(
			within(navigation).getByRole('button', { name: 'Reviews' }),
		).toBeInTheDocument()
		expect(
			within(navigation).queryByRole('button', { name: 'ancestor' }),
		).not.toBeInTheDocument()
		expect(
			within(navigation).queryByRole('button', { name: 'collection' }),
		).not.toBeInTheDocument()
		fireEvent.click(
			screen.getByRole('button', { name: 'Show collection path' }),
		)

		const menu = screen.getByRole('menu')
		expect(
			within(menu).getByRole('button', { name: 'root' }),
		).toBeInTheDocument()
		expect(
			within(menu).getByRole('button', { name: 'ancestor' }),
		).toBeInTheDocument()
		expect(
			within(menu).getByRole('button', { name: 'collection' }),
		).toBeInTheDocument()
	})

	it('closes the dialog when selecting any breadcrumb link', () => {
		const onOpenChange = vi.fn()
		renderBreadcrumbs(
			collectionDetail([collection('collection')]),
			onOpenChange,
		)

		for (const label of ['collection', 'Card', 'Reviews']) {
			fireEvent.click(screen.getByRole('button', { name: label }))
		}

		expect(onOpenChange.mock.calls.length).toBeGreaterThanOrEqual(3)
		expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything())

		const collapsedOnOpenChange = vi.fn()
		renderBreadcrumbs(
			collectionDetail([
				collection('root'),
				collection('ancestor'),
				collection('collection'),
			]),
			collapsedOnOpenChange,
		)
		fireEvent.click(
			screen.getByRole('button', { name: 'Show collection path' }),
		)
		fireEvent.click(screen.getByRole('button', { name: 'ancestor' }))

		expect(collapsedOnOpenChange).toHaveBeenCalledWith(
			false,
			expect.anything(),
		)
	})
})
