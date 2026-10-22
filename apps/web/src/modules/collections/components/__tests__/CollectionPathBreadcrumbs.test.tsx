import type { Id } from '@convex/_generated/dataModel'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { BreadcrumbItem, BreadcrumbPage } from '~/components/ui'

import type { Collection } from '../../types/collection.types'
import { CollectionPathBreadcrumbs } from '../CollectionPathBreadcrumbs'

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

// Reads the trail as labels, with `/` for separators and `…` for the overflow
// menu, so separator placement is asserted alongside the items.
function trail() {
	const list = screen
		.getByRole('navigation', { name: 'Collection path' })
		.querySelector('[data-slot="breadcrumb-list"]')!
	return Array.from(list.children, item =>
		item.getAttribute('data-slot') === 'breadcrumb-separator'
			? '/'
			: item.textContent || '…',
	)
}

function Trail({
	currentLabel,
	...props
}: Omit<ComponentProps<typeof CollectionPathBreadcrumbs>, 'children'> & {
	currentLabel: string
}) {
	return (
		<CollectionPathBreadcrumbs {...props}>
			<BreadcrumbItem>
				<BreadcrumbPage>{currentLabel}</BreadcrumbPage>
			</BreadcrumbItem>
		</CollectionPathBreadcrumbs>
	)
}

describe('CollectionPathBreadcrumbs', () => {
	it.each([
		{ name: 'no collections', titles: [], expected: ['Current'] },
		{
			name: 'one collection',
			titles: ['one'],
			expected: ['one', '/', 'Current'],
		},
		{
			name: 'the full trail at the boundary',
			titles: ['one', 'two', 'three'],
			expected: ['one', '/', 'two', '/', 'three', '/', 'Current'],
		},
		{
			name: 'a collapsed trail',
			titles: ['one', 'two', 'three', 'four'],
			expected: ['…', '/', 'four', '/', 'Current'],
		},
	])('places separators between items for $name', ({ titles, expected }) => {
		render(
			<Trail
				collections={titles.map(title => collection(title))}
				currentLabel='Current'
			/>,
		)

		expect(trail()).toEqual(expected)
	})

	it('renders the complete trail at the four-item boundary', () => {
		render(
			<Trail
				collections={[
					collection('one'),
					collection('two'),
					collection('three'),
				]}
				currentLabel='Current'
			/>,
		)

		const breadcrumb = screen.getByRole('navigation', {
			name: 'Collection path',
		})
		expect(within(breadcrumb).getAllByRole('link')).toHaveLength(3)
		expect(
			within(breadcrumb).getByRole('link', { name: 'three' }),
		).toBeInTheDocument()
		expect(
			within(breadcrumb).getByRole('link', { name: 'one' }),
		).toBeInTheDocument()
		expect(
			within(breadcrumb).getByRole('link', { name: 'two' }),
		).toBeInTheDocument()
		expect(within(breadcrumb).getByText('Current')).toHaveAttribute(
			'aria-current',
			'page',
		)
	})

	it('collapses older collections and puts only hidden collections in the overflow menu', () => {
		render(
			<Trail
				collections={[
					collection('one'),
					collection('two'),
					collection('three'),
					collection('four'),
				]}
				currentLabel='Current'
			/>,
		)

		const breadcrumb = screen.getByRole('navigation', {
			name: 'Collection path',
		})
		expect(
			within(breadcrumb).getByRole('link', { name: 'four' }),
		).toBeInTheDocument()
		expect(
			within(breadcrumb).queryByRole('link', { name: 'one' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Show hidden collections' }),
		).toBeInTheDocument()

		fireEvent.click(
			screen.getByRole('button', { name: 'Show hidden collections' }),
		)
		const menu = screen.getByRole('menu')
		expect(
			within(menu).getByRole('menuitem', { name: 'one' }),
		).toBeInTheDocument()
		expect(
			within(menu).getByRole('menuitem', { name: 'two' }),
		).toBeInTheDocument()
		expect(
			within(menu).getByRole('menuitem', { name: 'three' }),
		).toBeInTheDocument()
		expect(
			within(menu).queryByRole('menuitem', { name: 'four' }),
		).not.toBeInTheDocument()
	})

	it('uses Untitled for blank collection titles', () => {
		render(
			<Trail
				collections={[collection('blank', '  ')]}
				currentLabel='Current'
			/>,
		)

		expect(
			screen.getByRole('link', { name: 'Untitled' }),
		).toBeInTheDocument()
	})

	it('calls onNavigate from visible and overflow links', () => {
		const onNavigate = vi.fn()
		render(
			<Trail
				collections={[
					collection('one'),
					collection('two'),
					collection('three'),
					collection('four'),
				]}
				currentLabel='Current'
				onNavigate={onNavigate}
			/>,
		)

		fireEvent.click(screen.getByRole('link', { name: 'four' }))
		fireEvent.click(
			screen.getByRole('button', { name: 'Show hidden collections' }),
		)
		fireEvent.click(screen.getByRole('menuitem', { name: 'one' }))

		expect(onNavigate).toHaveBeenCalledTimes(2)
	})
})
