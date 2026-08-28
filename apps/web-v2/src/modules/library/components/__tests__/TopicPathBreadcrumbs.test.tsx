import type { Id } from '@convex/_generated/dataModel'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { Topic } from '../../types/topic.types'
import { TopicPathBreadcrumbs } from '../TopicPathBreadcrumbs'

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

function topic(id: string, title = id): Topic {
	return {
		_id: id as Id<'topics'>,
		_creationTime: 0,
		title,
		description: '',
		ownerId: 'owner',
		path: [],
		searchText: title,
	}
}

describe('TopicPathBreadcrumbs', () => {
	it('renders the complete trail at the four-item boundary', () => {
		render(
			<TopicPathBreadcrumbs
				topics={[topic('one'), topic('two')]}
				currentLabel='Current'
			/>,
		)

		const breadcrumb = screen.getByRole('navigation', {
			name: 'Topic path',
		})
		expect(within(breadcrumb).getAllByRole('link')).toHaveLength(3)
		expect(
			within(breadcrumb).getByRole('link', { name: 'Library' }),
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

	it('collapses older topics and puts only hidden topics in the overflow menu', () => {
		render(
			<TopicPathBreadcrumbs
				topics={[topic('one'), topic('two'), topic('three')]}
				currentLabel='Current'
			/>,
		)

		const breadcrumb = screen.getByRole('navigation', {
			name: 'Topic path',
		})
		expect(
			within(breadcrumb).getByRole('link', { name: 'three' }),
		).toBeInTheDocument()
		expect(
			within(breadcrumb).queryByRole('link', { name: 'one' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Show hidden topics' }),
		).toBeInTheDocument()

		fireEvent.click(
			screen.getByRole('button', { name: 'Show hidden topics' }),
		)
		const menu = screen.getByRole('menu')
		expect(
			within(menu).getByRole('menuitem', { name: 'one' }),
		).toBeInTheDocument()
		expect(
			within(menu).getByRole('menuitem', { name: 'two' }),
		).toBeInTheDocument()
		expect(
			within(menu).queryByRole('menuitem', { name: 'three' }),
		).not.toBeInTheDocument()
	})

	it('uses Untitled for blank labels', () => {
		render(
			<TopicPathBreadcrumbs
				topics={[topic('blank', '  ')]}
				currentLabel=' '
			/>,
		)

		expect(screen.getAllByText('Untitled')).toHaveLength(2)
	})

	it('calls onNavigate from library, visible, and overflow links', () => {
		const onNavigate = vi.fn()
		render(
			<TopicPathBreadcrumbs
				topics={[topic('one'), topic('two'), topic('three')]}
				currentLabel='Current'
				onNavigate={onNavigate}
			/>,
		)

		fireEvent.click(screen.getByRole('link', { name: 'Library' }))
		fireEvent.click(screen.getByRole('link', { name: 'three' }))
		fireEvent.click(
			screen.getByRole('button', { name: 'Show hidden topics' }),
		)
		fireEvent.click(screen.getByRole('menuitem', { name: 'one' }))

		expect(onNavigate).toHaveBeenCalledTimes(3)
	})
})
