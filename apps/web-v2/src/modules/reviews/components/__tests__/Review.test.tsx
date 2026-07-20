import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Review as ReviewModel } from '../../types/review.types'
import { Review } from '../Review'

const deleteReview = vi.fn()
const updateReview = vi.fn()

vi.mock('../../api/deleteReview', () => ({
	useDeleteReview: () => ({
		isPending: false,
		mutateAsync: deleteReview,
	}),
}))
vi.mock('../../api/updateReview', () => ({
	useUpdateReview: () => ({
		isPending: false,
		mutateAsync: updateReview,
	}),
}))

const review: ReviewModel = {
	id: 12,
	review_card_id: 3,
	rating: 'good',
	description: 'Photosynthesis review',
	notes: '',
	scheduled_at: '2026-07-18',
	completed_at: null,
	effective_date: '2026-07-18',
	inserted_at: '2026-07-18T12:00:00Z',
	updated_at: '2026-07-18T12:00:00Z',
	review_card: {
		id: 3,
		topic_id: 4,
		type: 'flashcard',
		primary_text: 'Photosynthesis',
		secondary_text: 'How plants convert light into energy',
	},
	stability_before: 2,
	difficulty_before: 5,
	state_before: 'LEARNING',
	step_before: 1,
	due_before: '2026-07-18',
	stability_after: 4,
	difficulty_after: 4,
	state_after: 'REVIEW',
	step_after: null,
	due_after: '2026-07-22',
}

describe('Review', () => {
	beforeEach(() => {
		deleteReview.mockReset().mockResolvedValue(undefined)
		updateReview.mockReset().mockResolvedValue(undefined)
	})

	it('requires confirmation before deleting a review', async () => {
		const user = userEvent.setup()
		render(<Review review={review} />)

		await user.click(
			screen.getByRole('button', { name: /Photosynthesis review/ }),
		)
		await user.click(screen.getByRole('button', { name: 'Review actions' }))
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(deleteReview).not.toHaveBeenCalled()
		expect(
			screen.getByRole('heading', { name: 'Delete review?' }),
		).toBeInTheDocument()
		expect(
			screen.getByText('This will delete this review.'),
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Cancel' }))
		expect(deleteReview).not.toHaveBeenCalled()
		expect(
			screen.queryByRole('heading', { name: 'Delete review?' }),
		).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Review actions' }))
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
		await user.click(screen.getByRole('button', { name: 'Delete' }))

		expect(deleteReview).toHaveBeenCalledOnce()
		expect(deleteReview).toHaveBeenCalledWith(12)
	})
})
