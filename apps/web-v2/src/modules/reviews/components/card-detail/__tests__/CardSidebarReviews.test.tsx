import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CardSidebarReviews } from '../CardSidebarReviews'

vi.mock('../../ReviewComposer', () => ({
	ReviewComposer: () => <div data-testid='review-composer' />,
}))

vi.mock('../CardReviewsPanel', () => ({
	CardReviewsPanel: () => <section>Reviews panel</section>,
}))

const cardId = 'card-1' as Id<'cards'>

describe('CardSidebarReviews', () => {
	it('always shows the composer above the reviews panel', () => {
		render(<CardSidebarReviews cardId={cardId} />)

		expect(screen.getByTestId('review-composer')).toBeInTheDocument()
		expect(screen.getByText('Reviews panel')).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Add review' }),
		).not.toBeInTheDocument()
	})
})
