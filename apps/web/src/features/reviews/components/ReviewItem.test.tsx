import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ReviewListItem } from '../types/review.types'
import { ReviewItem } from './ReviewItem'

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => vi.fn()
}))

vi.mock('../api/updateReview', () => ({
	useUpdateReview: () => ({
		isPending: false,
		mutateAsync: vi.fn()
	})
}))

vi.mock('../api/deleteReview', () => ({
	useDeleteReview: () => ({
		mutateAsync: vi.fn()
	})
}))

const entry: ReviewListItem = {
	id: 7,
	review_card_id: 11,
	rating: null,
	description: 'Review item',
	notes: '',
	scheduled_at: null,
	completed_at: null,
	effective_date: null,
	inserted_at: '2026-03-12T00:00:00Z',
	updated_at: '2026-03-12T00:00:00Z',
	review_card: {
		id: 11,
		topic_id: 5,
		type: 'flashcard',
		prompt: 'Prompt',
		answer: 'Answer'
	},
	stability_before: null,
	difficulty_before: null,
	state_before: null,
	step_before: null,
	due_before: null,
	stability_after: null,
	difficulty_after: null,
	state_after: null,
	step_after: null,
	due_after: null
}

describe('ReviewItem', () => {
	it('opens only one date picker popover when a date trigger is clicked', async () => {
		const user = userEvent.setup()

		render(<ReviewItem entry={entry} />)

		const dateButtons = screen.getAllByRole('button', { name: /no date/i })
		expect(dateButtons).toHaveLength(2)

		const dateButton = dateButtons[0]!
		await user.click(dateButton)

		expect(
			await screen.findAllByRole('button', { name: 'Clear' })
		).toHaveLength(1)
	})
})
