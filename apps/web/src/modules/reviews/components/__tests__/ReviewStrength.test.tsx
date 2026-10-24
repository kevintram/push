import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import type { Review } from '../../types/review.types'
import { ReviewStrength } from '../ReviewStrength'

function review(overrides: Partial<Review> = {}): Review {
	return {
		_creationTime: 0,
		_id: 'review-1' as Id<'reviews'>,
		cardId: 'card-1' as Id<'cards'>,
		description: '',
		notes: '',
		ownerId: 'user-1',
		rating: 'good',
		stabilityAfter: 130.4,
		stabilityBefore: 122,
		...overrides,
	} as Review
}

function renderStrength(value: Review) {
	render(
		<TooltipProvider delay={0}>
			<ReviewStrength review={value} />
		</TooltipProvider>,
	)
}

describe('ReviewStrength', () => {
	it('shows the strength, its change, and an explanation', async () => {
		const user = userEvent.setup()
		renderStrength(review())

		expect(screen.getByText('(+8d)')).toBeInTheDocument()
		await user.hover(screen.getByText('4mo'))

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'Estimated to remember for at least 4mo',
		)
	})

	it('shows a lost strength with a minus sign', () => {
		renderStrength(review({ stabilityAfter: 240, stabilityBefore: 248 }))

		expect(screen.getByText('(−8d)')).toBeInTheDocument()
	})

	it('marks the first review of a card as new', () => {
		renderStrength(
			review({ stabilityAfter: 4, stabilityBefore: undefined }),
		)

		expect(screen.getByText('4d')).toBeInTheDocument()
		expect(screen.getByText('(new)')).toBeInTheDocument()
	})

	it('shows a dash without a strength', () => {
		renderStrength(
			review({
				rating: undefined,
				stabilityAfter: undefined,
				stabilityBefore: undefined,
			}),
		)

		expect(screen.getByText('—')).toBeInTheDocument()
	})
})
