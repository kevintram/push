import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { formatRelativeDate, getTodayAsString } from '~/utils/date'

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
	scheduled_at: null,
	completed_at: '2026-07-18',
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

		await user.click(screen.getByRole('button', { name: 'Review actions' }))
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(deleteReview).not.toHaveBeenCalled()
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
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

	it('keeps the rating menu independent from the dialog trigger', async () => {
		const user = userEvent.setup()
		render(
			<Review
				review={{
					...review,
					completed_at: null,
					rating: null,
					scheduled_at: '2026-07-18',
				}}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Uncompleted' }))

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		expect(screen.getByRole('menu')).toBeInTheDocument()

		await user.click(screen.getByRole('menuitemradio', { name: 'Easy' }))

		expect(updateReview).toHaveBeenCalledWith({
			id: 12,
			rating: 'easy',
			completed_at: getTodayAsString(),
		})
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})

	it('can mark a completed review as uncompleted', async () => {
		const user = userEvent.setup()
		render(<Review review={review} />)

		await user.click(screen.getByRole('button', { name: 'Good' }))
		await user.click(
			screen.getByRole('menuitemradio', { name: 'Uncompleted' }),
		)

		expect(updateReview).toHaveBeenCalledWith({
			id: 12,
			rating: null,
			completed_at: null,
		})
	})

	it('shows review metadata and a notes indicator in the row', () => {
		render(<Review review={{ ...review, notes: 'Remember this' }} />)

		expect(screen.getByLabelText('Has notes')).toBeInTheDocument()
		expect(screen.getByText('4d')).toBeInTheDocument()
		expect(screen.getByText('(+2)')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /Change review date/ }),
		).toHaveTextContent(formatRelativeDate('2026-07-18'))
	})

	it('shows the absolute date in a tooltip', async () => {
		const user = userEvent.setup()
		render(<Review review={review} />)

		await user.hover(
			screen.getByRole('button', { name: /Change review date/ }),
		)

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'Jul 18, 2026',
		)
	})

	it('updates the scheduled date without opening the review dialog', async () => {
		const user = userEvent.setup()
		render(
			<Review
				review={{
					...review,
					completed_at: null,
					rating: null,
					scheduled_at: '2026-07-18',
				}}
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: /Change review date/ }),
		)
		await user.click(screen.getByRole('button', { name: 'Clear' }))

		expect(updateReview).toHaveBeenCalledWith({
			id: 12,
			scheduled_at: null,
		})
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
	})

	it('clears the rating when clearing a completed date', async () => {
		const user = userEvent.setup()
		render(<Review review={review} />)

		await user.click(
			screen.getByRole('button', { name: /Change review date/ }),
		)
		await user.click(screen.getByRole('button', { name: 'Clear' }))

		expect(updateReview).toHaveBeenCalledWith({
			id: 12,
			completed_at: null,
			rating: null,
		})
	})

	it('opens the calendar on the selected date month', async () => {
		const user = userEvent.setup()
		render(
			<Review
				review={{
					...review,
					completed_at: null,
					rating: null,
					scheduled_at: '2025-01-15',
				}}
			/>,
		)

		await user.click(
			screen.getByRole('button', { name: /Change review date/ }),
		)

		expect(
			screen.getByRole('grid', { name: 'January 2025' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', {
				name: 'Wednesday, January 15th, 2025, selected',
			}),
		).toBeInTheDocument()
	})
})
