import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { TopicWithChildren } from '~/modules/library/types/topic.types'

import { MoveTopicItem } from '../MoveTopicItem'

function topic(
	id: string,
	childTopics: Array<TopicWithChildren> = [],
): TopicWithChildren {
	return {
		_id: id as Id<'topics'>,
		_creationTime: 0,
		title: id,
		description: '',
		ownerId: 'owner',
		path: [],
		searchText: id,
		childTopics,
	}
}

describe('MoveTopicItem', () => {
	it('renders a topic and its children recursively', () => {
		render(
			<ul>
				<MoveTopicItem
					{...topic('parent', [
						topic('child', [topic('grandchild')]),
					])}
					onSelect={vi.fn()}
					selectedTopicId={null}
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
				<MoveTopicItem
					{...topic('parent', [
						topic('child', [topic('grandchild')]),
					])}
					onSelect={vi.fn()}
					selectedTopicId={'parent' as Id<'topics'>}
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

	it('marks the selected topic with aria-pressed', () => {
		render(
			<ul>
				<MoveTopicItem
					{...topic('parent', [topic('child')])}
					onSelect={vi.fn()}
					selectedTopicId={'child' as Id<'topics'>}
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

	it('calls onSelect with the topic ID when clicked', async () => {
		const onSelect = vi.fn()

		render(
			<ul>
				<MoveTopicItem
					{...topic('parent', [topic('child')])}
					onSelect={onSelect}
					selectedTopicId={null}
				/>
			</ul>,
		)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'child' }))

		expect(onSelect).toHaveBeenCalledWith('child')
	})

	it('renders untitled topics with a fallback label', () => {
		render(
			<ul>
				<MoveTopicItem
					{...topic('id')}
					title='   '
					onSelect={vi.fn()}
					selectedTopicId={null}
				/>
			</ul>,
		)

		expect(
			screen.getByRole('button', { name: 'Untitled' }),
		).toBeInTheDocument()
	})
})
