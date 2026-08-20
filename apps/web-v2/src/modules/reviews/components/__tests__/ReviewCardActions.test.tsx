import type { ReviewCard } from '@convex/validators/reviewCards'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateTime } from 'luxon'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Topic } from '~/modules/library/types/topic.types'

import { ReviewCardActions } from '../ReviewCardActions'

const updateMutate = vi.fn()
const deleteMutate = vi.fn()

const topics = [
	{
		_id: 'topic-1' as Topic['_id'],
		_creationTime: 0,
		description: '',
		ownerId: 'user-1',
		searchText: 'Languages',
		title: 'Languages',
	},
	{
		_id: 'topic-2' as Topic['_id'],
		_creationTime: 1,
		description: '',
		ownerId: 'user-1',
		parentId: 'topic-1' as Topic['_id'],
		searchText: 'Spanish',
		title: 'Spanish',
	},
] as const satisfies ReadonlyArray<Topic>

const TOPIC_LIST_KEY = ['convex', 'topics', 'list']

vi.mock('~/modules/library/api/topicQueries', () => ({
	topicQueries: {
		list: () => ({ queryKey: TOPIC_LIST_KEY, queryFn: () => topics }),
	},
}))

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQuery: (opts: { queryKey: Array<unknown> }) => {
			if (
				JSON.stringify(opts.queryKey) === JSON.stringify(TOPIC_LIST_KEY)
			) {
				return { data: topics, isError: false, isPending: false }
			}
			return { data: undefined, isError: false, isPending: true }
		},
	}
})

vi.mock('../../api/reviewCardQueries', () => ({
	useUpdateReviewCard: () => ({ mutate: updateMutate, isPending: false }),
	useDeleteReviewCard: () => ({ mutate: deleteMutate, isPending: false }),
}))

const reviewCard: ReviewCard = {
	_id: 'review-card-1' as ReviewCard['_id'],
	_creationTime: 0,
	topicId: 'topic-1' as ReviewCard['topicId'],
	ownerId: 'user-1',
	type: 'flashcard',
	primaryText: 'Question',
	secondaryText: 'Answer',
	notes: '',
	state: 'LEARNING',
	searchText: 'Question\nAnswer',
}

function openMenu() {
	return userEvent
		.setup()
		.click(screen.getByRole('button', { name: 'Review card actions' }))
}

describe('ReviewCardActions', () => {
	beforeEach(() => {
		updateMutate.mockClear()
		deleteMutate.mockClear()
	})

	it('turns a flashcard into a practice card', async () => {
		render(<ReviewCardActions reviewCard={reviewCard} />)

		await openMenu()
		await userEvent
			.setup()
			.click(screen.getByRole('menuitem', { name: 'Unflashcardify' }))

		expect(updateMutate).toHaveBeenCalledWith(
			{ reviewCardId: reviewCard._id, type: 'practice' },
			expect.anything(),
		)
	})

	it('flags an unflagged card with the current time', async () => {
		const before = DateTime.now().toMillis()
		render(<ReviewCardActions reviewCard={reviewCard} />)

		await openMenu()
		await userEvent
			.setup()
			.click(screen.getByRole('menuitem', { name: 'Flag' }))

		expect(updateMutate).toHaveBeenCalledWith(
			{
				reviewCardId: reviewCard._id,
				flaggedAt: expect.any(Number) as number,
			},
			expect.anything(),
		)
		const [args] = updateMutate.mock.calls[0] as [{ flaggedAt: number }]
		expect(args.flaggedAt).toBeGreaterThanOrEqual(before)
	})

	it('clears the flag on a flagged card', async () => {
		render(
			<ReviewCardActions
				reviewCard={{ ...reviewCard, flaggedAt: 1_700_000_000_000 }}
			/>,
		)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Unflag' }))

		expect(updateMutate).toHaveBeenCalledWith(
			{ reviewCardId: reviewCard._id, flaggedAt: null },
			expect.anything(),
		)
	})

	it('deletes only after the confirmation is accepted', async () => {
		const user = userEvent.setup()
		render(<ReviewCardActions reviewCard={reviewCard} />)

		await openMenu()
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(deleteMutate).not.toHaveBeenCalled()

		await user.click(screen.getByRole('button', { name: 'Delete' }))

		expect(deleteMutate).toHaveBeenCalledWith(
			{ reviewCardId: reviewCard._id },
			expect.anything(),
		)
	})

	it('moves to the selected topic and closes after success', async () => {
		const user = userEvent.setup()
		render(<ReviewCardActions reviewCard={reviewCard} />)

		await openMenu()
		await user.click(screen.getByRole('menuitem', { name: 'Move' }))

		const moveButton = screen.getByRole('button', { name: 'Move' })
		expect(moveButton).toBeDisabled()

		await user.click(screen.getByRole('button', { name: 'Spanish' }))
		expect(moveButton).toBeEnabled()
		await user.click(moveButton)

		expect(updateMutate).toHaveBeenCalledWith(
			{
				reviewCardId: reviewCard._id,
				topicId: topics[1]._id,
			},
			expect.anything(),
		)
		expect(
			screen.getByRole('dialog', { name: 'Move review card' }),
		).toBeInTheDocument()

		const [, options] = updateMutate.mock.calls.at(-1) as [
			unknown,
			{ onSuccess: () => void },
		]
		act(() => options.onSuccess())

		expect(
			screen.queryByRole('dialog', { name: 'Move review card' }),
		).not.toBeInTheDocument()
	})
})
