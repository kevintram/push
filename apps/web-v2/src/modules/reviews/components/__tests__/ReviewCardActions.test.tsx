import type { Doc } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateTime } from 'luxon'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewCardActions } from '../ReviewCardActions'

const updateMutate = vi.fn()
const deleteMutate = vi.fn()

vi.mock('../../api/reviewCardQueries', () => ({
	useUpdateReviewCard: () => ({ mutate: updateMutate, isPending: false }),
	useDeleteReviewCard: () => ({ mutate: deleteMutate, isPending: false }),
}))

const reviewCard: Doc<'reviewCards'> = {
	_id: 'review-card-1' as Doc<'reviewCards'>['_id'],
	_creationTime: 0,
	topicId: 'topic-1' as Doc<'reviewCards'>['topicId'],
	ownerId: 'user-1',
	type: 'flashcard',
	primaryText: 'Question',
	secondaryText: 'Answer',
	notes: '',
	state: 'LEARNING',
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
			.click(screen.getByRole('menuitem', { name: 'Unflashcard' }))

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
})
