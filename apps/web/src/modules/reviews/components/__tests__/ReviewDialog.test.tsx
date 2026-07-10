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
			reviewCardId: 11,
			rating: null,
			description: 'Review description',
			notes: 'Review notes',
			scheduledAt: null,
			completedAt: null,
			effectiveDate: null,
			insertedAt: '2026-03-12T00:00:00Z',
			updatedAt: '2026-03-12T00:00:00Z',
			reviewCard: {
				id: 11,
				topicId: 5,
				type: 'flashcard',
				primaryText: 'Prompt',
				secondaryText: 'Answer',
			},
			stabilityBefore: null,
			difficultyBefore: null,
			stateBefore: null,
			stepBefore: null,
			dueBefore: null,
			stabilityAfter: null,
			difficultyAfter: null,
			stateAfter: null,
			stepAfter: null,
			dueAfter: null,
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
