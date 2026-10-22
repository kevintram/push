import type { Id } from '@convex/_generated/dataModel'
import type {
	Collection,
	CollectionDetail,
} from '@convex/validators/collections'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

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

function collectionDetail(ids: Array<string>): CollectionDetail {
	return {
		...collection(ids.at(-1)!),
		path: ids.slice(0, -1).map(id => collection(id)),
	}
}

function renderBreadcrumbs(
	collection: CollectionDetail | undefined,
	onNavigate = vi.fn(),
) {
	return render(
		<ReviewDialogBreadcrumbs
			card={undefined}
			cardId={'card' as Id<'cards'>}
			collection={collection}
			onNavigate={onNavigate}
		/>,
	)
}

// Reads the trail as labels, with `/` for separators and `…` for the overflow
// menu, so separator placement is asserted alongside the items.
function trail() {
	const list = screen
		.getByRole('navigation', { name: 'Collection path' })
		.querySelector('[data-slot="breadcrumb-list"]')!
	return Array.from(list.children, item => {
		if (item.getAttribute('data-slot') === 'breadcrumb-separator') {
			return '/'
		}
		return item.querySelector('[data-slot="breadcrumb-ellipsis"]')
			? '…'
			: item.textContent
	})
}

describe('ReviewDialogBreadcrumbs', () => {
	it.each([
		{
			name: 'no collection',
			ids: undefined,
			expected: ['Card', '/', 'Reviews'],
		},
		{
			name: 'one collection',
			ids: ['collection'],
			expected: ['collection', '/', 'Card', '/', 'Reviews'],
		},
		{
			name: 'a collapsed path',
			ids: ['root', 'grandparent', 'ancestor', 'collection'],
			expected: ['…', '/', 'collection', '/', 'Card', '/', 'Reviews'],
		},
	])(
		'ends the trail with the card and reviews for $name',
		({ ids, expected }) => {
			renderBreadcrumbs(ids && collectionDetail(ids))

			expect(trail()).toEqual(expected)
		},
	)

	it('calls onNavigate from every link, including hidden collections', () => {
		const onNavigate = vi.fn()
		renderBreadcrumbs(
			collectionDetail(['root', 'grandparent', 'ancestor', 'collection']),
			onNavigate,
		)

		for (const label of ['collection', 'Card', 'Reviews']) {
			fireEvent.click(screen.getByRole('link', { name: label }))
		}
		fireEvent.click(
			screen.getByRole('button', { name: 'Show hidden collections' }),
		)
		fireEvent.click(screen.getByRole('menuitem', { name: 'root' }))

		expect(onNavigate).toHaveBeenCalledTimes(4)
	})
})
