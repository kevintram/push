import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { TopicWithChildren } from '~/modules/library/types/topic.types'

import { MoveTopicTree } from '../MoveTopicTree'

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

describe('MoveTopicTree', () => {
	it('renders topics as a selectable tree', () => {
		render(
			<MoveTopicTree
				onSelect={vi.fn()}
				selectedDestination={null}
				topics={[topic('A', [topic('B')]), topic('C')]}
			/>,
		)

		expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'B' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'C' })).toBeInTheDocument()
	})

	it('renders a selectable Library root when allowLibraryRoot is true', () => {
		render(
			<MoveTopicTree
				allowLibraryRoot
				onSelect={vi.fn()}
				selectedDestination={null}
				topics={[topic('A')]}
			/>,
		)

		expect(
			screen.getByRole('button', { name: 'Library' }),
		).toBeInTheDocument()
	})

	it('does not render Library root by default', () => {
		render(
			<MoveTopicTree
				onSelect={vi.fn()}
				selectedDestination={null}
				topics={[topic('A')]}
			/>,
		)

		expect(
			screen.queryByRole('button', { name: 'Library' }),
		).not.toBeInTheDocument()
	})

	it('calls onSelect with null when Library root is clicked', async () => {
		const onSelect = vi.fn()

		render(
			<MoveTopicTree
				allowLibraryRoot
				onSelect={onSelect}
				selectedDestination={'A' as Id<'topics'>}
				topics={[topic('A')]}
			/>,
		)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Library' }))

		expect(onSelect).toHaveBeenCalledWith(null)
	})

	it('marks the Library root as selected when destination is null', () => {
		render(
			<MoveTopicTree
				allowLibraryRoot
				onSelect={vi.fn()}
				selectedDestination={null}
				topics={[topic('A')]}
			/>,
		)

		expect(screen.getByRole('button', { name: 'Library' })).toHaveAttribute(
			'aria-pressed',
			'true',
		)
	})

	it('excludes the specified topic and its entire subtree', () => {
		render(
			<MoveTopicTree
				excludeTopicId={'B' as Id<'topics'>}
				onSelect={vi.fn()}
				selectedDestination={null}
				topics={[
					topic('A', [topic('B', [topic('B-child')]), topic('C')]),
				]}
			/>,
		)

		expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'C' })).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'B' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'B-child' }),
		).not.toBeInTheDocument()
	})

	it('excludes a root-level topic and its subtree', () => {
		render(
			<MoveTopicTree
				excludeTopicId={'A' as Id<'topics'>}
				onSelect={vi.fn()}
				selectedDestination={null}
				topics={[topic('A', [topic('A-child')]), topic('B')]}
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

	it('leaves unrelated branches available when excluding a subtree', () => {
		render(
			<MoveTopicTree
				excludeTopicId={'B' as Id<'topics'>}
				onSelect={vi.fn()}
				selectedDestination={null}
				topics={[
					topic('A', [topic('B'), topic('C')]),
					topic('D', [topic('E')]),
				]}
			/>,
		)

		for (const name of ['A', 'C', 'D', 'E']) {
			expect(screen.getByRole('button', { name })).toBeInTheDocument()
		}
		expect(
			screen.queryByRole('button', { name: 'B' }),
		).not.toBeInTheDocument()
	})
})
