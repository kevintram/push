import type { Id } from '@convex/_generated/dataModel'
import type { Topic, TopicDetail } from '@convex/validators/topics'
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

function topicDetail(topics: Array<Topic>): TopicDetail {
	const current = topic(topics.at(-1)?._id ?? 'current')
	return { ...current, path: topics.slice(0, -1) }
}

function renderBreadcrumbs(topic: TopicDetail, onOpenChange = vi.fn()) {
	return render(
		<Dialog open onOpenChange={onOpenChange}>
			<ReviewDialogBreadcrumbs
				reviewCard={undefined}
				reviewCardId={'review-card' as Id<'reviewCards'>}
				topic={topic}
			/>
		</Dialog>,
	)
}

describe('ReviewDialogBreadcrumbs', () => {
	it('keeps one topic visible when the complete trail fits', () => {
		const breadcrumb = renderBreadcrumbs(topicDetail([topic('topic')]))

		expect(
			screen.getByRole('button', { name: 'topic' }),
		).toBeInTheDocument()
		expect(
			within(
				screen.getByRole('navigation', { name: 'Review location' }),
			).queryByRole('button', { name: 'Show topic path' }),
		).not.toBeInTheDocument()
		breadcrumb.unmount()
	})

	it('moves all topics into a purpose-specific overflow menu', () => {
		renderBreadcrumbs(topicDetail([topic('ancestor'), topic('topic')]))

		const navigation = screen.getByRole('navigation', {
			name: 'Review location',
		})
		expect(
			within(navigation).getByRole('button', { name: 'Review card' }),
		).toBeInTheDocument()
		expect(
			within(navigation).getByRole('button', { name: 'Reviews' }),
		).toBeInTheDocument()
		expect(
			within(navigation).queryByRole('button', { name: 'ancestor' }),
		).not.toBeInTheDocument()
		expect(
			within(navigation).queryByRole('button', { name: 'topic' }),
		).not.toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: 'Show topic path' }))

		const menu = screen.getByRole('menu')
		expect(
			within(menu).getByRole('button', { name: 'ancestor' }),
		).toBeInTheDocument()
		expect(
			within(menu).getByRole('button', { name: 'topic' }),
		).toBeInTheDocument()
	})

	it('closes the dialog when selecting any breadcrumb link', () => {
		const onOpenChange = vi.fn()
		renderBreadcrumbs(topicDetail([topic('topic')]), onOpenChange)

		for (const label of ['Library', 'topic', 'Review card', 'Reviews']) {
			fireEvent.click(screen.getByRole('button', { name: label }))
		}

		expect(onOpenChange.mock.calls.length).toBeGreaterThanOrEqual(4)
		expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything())

		const collapsedOnOpenChange = vi.fn()
		renderBreadcrumbs(
			topicDetail([topic('ancestor'), topic('topic')]),
			collapsedOnOpenChange,
		)
		fireEvent.click(screen.getByRole('button', { name: 'Show topic path' }))
		fireEvent.click(screen.getByRole('button', { name: 'ancestor' }))

		expect(collapsedOnOpenChange).toHaveBeenCalledWith(
			false,
			expect.anything(),
		)
	})
})
