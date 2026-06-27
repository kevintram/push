import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ReviewDialog } from '../ReviewDialog'

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => vi.fn(),
}))

vi.mock('../../api/getReviews', () => ({
	useReview: () => ({
		data: {
			id: 7,
			review_card_id: 11,
			rating: null,
			description: 'Review description',
			notes: 'Review notes',
			scheduled_at: null,
			completed_at: null,
			effective_date: null,
			inserted_at: '2026-03-12T00:00:00Z',
			updated_at: '2026-03-12T00:00:00Z',
			review_card: {
				id: 11,
				topic_id: 5,
				type: 'flashcard',
				primary_text: 'Prompt',
				secondary_text: 'Answer',
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
			due_after: null,
		},
		isLoading: false,
	}),
}))

vi.mock('../../api/updateReview', () => ({
	useUpdateReview: () => ({
		isPending: false,
		mutate: vi.fn(),
	}),
}))

vi.mock('../../api/deleteReview', () => ({
	useDeleteReview: () => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
	}),
}))

describe('ReviewDialog', () => {
	it('expands and resets to compact after close', async () => {
		const user = userEvent.setup()
		const onOpenChange = vi.fn()
		const { rerender } = render(
			<ReviewDialog
				onOpenChange={onOpenChange}
				open={true}
				reviewId={7}
			/>,
		)

		let dialogContent = document.querySelector(
			'[data-slot="dialog-content"]',
		)
		expect(dialogContent).toHaveClass('sm:max-w-[540px]')

		await user.click(
			screen.getByRole('button', { name: 'Expand review dialog' }),
		)

		expect(dialogContent).toHaveClass('sm:max-w-5xl')
		expect(
			screen.getByRole('button', { name: 'Collapse review dialog' }),
		).toBeInTheDocument()

		rerender(
			<ReviewDialog
				onOpenChange={onOpenChange}
				open={false}
				reviewId={7}
			/>,
		)

		await waitFor(() => {
			expect(
				screen.queryByRole('button', {
					name: 'Collapse review dialog',
				}),
			).not.toBeInTheDocument()
		})

		rerender(
			<ReviewDialog
				onOpenChange={onOpenChange}
				open={true}
				reviewId={7}
			/>,
		)

		expect(
			screen.getByRole('button', { name: 'Expand review dialog' }),
		).toBeInTheDocument()
		dialogContent = document.querySelector('[data-slot="dialog-content"]')
		expect(dialogContent).toHaveClass('sm:max-w-[540px]')
	})
})
