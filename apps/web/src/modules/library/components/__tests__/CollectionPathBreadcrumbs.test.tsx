import type { Id } from '@convex/_generated/dataModel'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

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

describe('CollectionPathBreadcrumbs', () => {
	it('renders the complete trail at the four-item boundary', () => {
		render(
			<CollectionPathBreadcrumbs
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
			<CollectionPathBreadcrumbs
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

	it('uses Untitled for blank labels', () => {
		render(
			<CollectionPathBreadcrumbs
				collections={[collection('blank', '  ')]}
				currentLabel=' '
			/>,
		)

		expect(screen.getAllByText('Untitled')).toHaveLength(2)
	})

	it('calls onNavigate from visible and overflow links', () => {
		const onNavigate = vi.fn()
		render(
			<CollectionPathBreadcrumbs
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
