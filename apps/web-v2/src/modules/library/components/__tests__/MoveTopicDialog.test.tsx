import type { Id } from '@convex/_generated/dataModel'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Topic } from '~/modules/library/types/topic.types'

import { MoveTopicDialog } from '../MoveTopicDialog'

const updateMutate = vi.fn()

const topics: ReadonlyArray<Topic> = [
	{
		_id: 'topic-1' as Id<'topics'>,
		_creationTime: 0,
		description: '',
		ownerId: 'user-1',
		title: 'Languages',
	},
	{
		_id: 'topic-2' as Id<'topics'>,
		_creationTime: 1,
		description: '',
		ownerId: 'user-1',
		parentId: 'topic-1' as Id<'topics'>,
		title: 'Spanish',
	},
	{
		_id: 'topic-3' as Id<'topics'>,
		_creationTime: 2,
		description: '',
		ownerId: 'user-1',
		title: 'Science',
	},
]
const languages = topics[0] as Topic
const spanish = topics[1] as Topic

vi.mock('~/modules/library/api/topicQueries', () => ({
	topicQueries: {
		list: () => ({
			queryKey: ['convex', 'topics', 'list'],
			queryFn: () => topics,
		}),
	},
	useUpdateTopic: () => ({ mutate: updateMutate, isPending: false }),
}))

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQuery: () => ({
			data: [...topics],
			isError: false,
			isPending: false,
		}),
	}
})

describe('MoveTopicDialog', () => {
	beforeEach(() => {
		updateMutate.mockClear()
	})

	it('reparents to another topic', async () => {
		const user = userEvent.setup()
		const onOpenChange = vi.fn()

		render(
			<MoveTopicDialog
				onOpenChange={onOpenChange}
				parentId={spanish.parentId}
				topicId={spanish._id}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Science' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(updateMutate).toHaveBeenCalledWith(
			{ topicId: 'topic-2', parentId: 'topic-3' },
			expect.anything(),
		)
	})

	it('moves a nested topic to Library root with parentId null', async () => {
		const user = userEvent.setup()

		render(
			<MoveTopicDialog
				onOpenChange={vi.fn()}
				parentId={spanish.parentId}
				topicId={spanish._id}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Library' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(updateMutate).toHaveBeenCalledWith(
			{ topicId: 'topic-2', parentId: null },
			expect.anything(),
		)
	})

	it('excludes the moving topic from the destination tree', () => {
		render(
			<MoveTopicDialog
				onOpenChange={vi.fn()}
				parentId={languages.parentId}
				topicId={languages._id}
			/>,
		)

		expect(
			screen.queryByRole('button', { name: 'Languages' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Spanish' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Science' }),
		).toBeInTheDocument()
	})

	it('closes only after a successful mutation', async () => {
		const user = userEvent.setup()
		const onOpenChange = vi.fn()

		render(
			<MoveTopicDialog
				onOpenChange={onOpenChange}
				parentId={spanish.parentId}
				topicId={spanish._id}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Science' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(onOpenChange).not.toHaveBeenCalled()

		const [, options] = updateMutate.mock.calls.at(-1) as [
			unknown,
			{ onSuccess: () => void },
		]
		act(() => options.onSuccess())

		expect(onOpenChange).toHaveBeenCalledWith(false)
	})

	it('renders a description about moving subtopics', () => {
		render(
			<MoveTopicDialog
				onOpenChange={vi.fn()}
				parentId={languages.parentId}
				topicId={languages._id}
			/>,
		)

		expect(
			screen.getByText(
				'Subtopics and review cards will move with this topic.',
			),
		).toBeInTheDocument()
	})
})
