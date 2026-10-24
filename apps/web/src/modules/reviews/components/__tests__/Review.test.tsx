import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import type { Review as ReviewModel } from '../../types/review.types'
import { Review } from '../Review'

vi.mock('../../hooks/useReviewActions', () => ({
	useReviewActions: () => ({
		confirmDelete: vi.fn(),
		isDeleteDialogOpen: false,
		isDeleting: false,
		setDate: vi.fn(),
		setIsDeleteDialogOpen: vi.fn(),
		setRating: vi.fn(),
	}),
}))

vi.mock('../../hooks/useReviewField', () => ({
	useReviewField: ({ value }: { value: string }) => ({
		flush: vi.fn(),
		onChange: vi.fn(),
		value,
	}),
}))

vi.mock('../ReviewDialog', () => ({
	ReviewDialog: () => null,
}))

function review(overrides: Partial<ReviewModel> = {}): ReviewModel {
	return {
		_creationTime: 0,
		_id: 'review-1' as Id<'reviews'>,
		cardId: 'card-1' as Id<'cards'>,
		date: '2026-10-13',
		description: 'Review cellular respiration.',
		notes: '',
		ownerId: 'user-1',
		rating: 'good',
		stabilityAfter: 12,
		stabilityBefore: 4,
		...overrides,
	} as ReviewModel
}

function renderReview(value: ReviewModel) {
	render(
		<TooltipProvider delay={0}>
			<table>
				<tbody>
					<Review review={value} />
				</tbody>
			</table>
		</TooltipProvider>,
	)
}

describe('Review', () => {
	it('opens the review from its description', () => {
		renderReview(review())

		expect(
			screen.getByRole('button', {
				name: 'Review cellular respiration.',
			}),
		).toBeInTheDocument()
		expect(screen.getByText('12d')).toBeInTheDocument()
		expect(screen.queryByText('No description')).not.toBeInTheDocument()
	})

	it('shows the date as read-only text', () => {
		renderReview(review())

		expect(screen.getByText('Oct 13')).toHaveAttribute(
			'datetime',
			'2026-10-13',
		)
		expect(
			screen.queryByRole('button', { name: /review date/ }),
		).not.toBeInTheDocument()
	})

	it('gives screen readers the full date beside a short one', () => {
		renderReview(review())

		expect(screen.getByText('Oct 13').parentElement).toHaveTextContent(
			'Oct 13, Oct 13, 2026',
		)
	})

	// Happy DOM evaluates no container queries, so this checks the table's
	// dash; the stacked layout hides it with CSS.
	it('shows a dash for an unscheduled date', () => {
		renderReview(review({ date: undefined, rating: undefined }))

		expect(screen.queryByText('Unscheduled')).not.toBeInTheDocument()
		expect(document.querySelector('time')).toBeNull()
		expect(screen.getByRole('cell', { name: '—' })).toBeInTheDocument()
	})

	it('names the row and hides the placeholder when there is no description', () => {
		renderReview(review({ description: '  ' }))

		expect(
			screen.getByRole('button', { name: 'Open review' }),
		).toBeInTheDocument()
		expect(screen.getByText('—')).toHaveAttribute('aria-hidden', 'true')
	})

	// Happy DOM evaluates no container queries, so this checks the dash is
	// still rendered for the table; the stacked layout hides it with CSS.
	it('keeps the strength dash for a pending review', () => {
		renderReview(review({ rating: undefined, stabilityAfter: undefined }))

		expect(screen.getByText('—', { exact: false })).toBeInTheDocument()
	})

	// Happy DOM evaluates no container queries, so both markers render: with
	// the description for the table, and before the date for the stacked
	// layout. CSS shows one.
	it.each([
		['with a description', 'Review cellular respiration.'],
		['without a description', ''],
	])('marks a review that has notes %s', (_, description) => {
		renderReview(review({ description, notes: 'Some notes' }))

		expect(screen.getAllByLabelText('Has notes')).toHaveLength(2)
	})

	it('shows the full date on hover', async () => {
		renderReview(review())

		await userEvent.hover(screen.getByText('Oct 13'))

		expect(
			await screen.findByText('Completed Oct 13, 2026'),
		).toBeInTheDocument()
	})

	it('previews the first line of the notes on hover', async () => {
		renderReview(
			review({ description: '', notes: 'Recheck the ATP yield.\nMore' }),
		)

		await userEvent.hover(screen.getAllByLabelText('Has notes')[0]!)

		expect(
			await screen.findByText('Recheck the ATP yield.'),
		).toBeInTheDocument()
	})

	it('omits the notes marker without notes', () => {
		renderReview(review({ notes: '  ' }))

		expect(screen.queryByLabelText('Has notes')).not.toBeInTheDocument()
	})
})
