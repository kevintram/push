import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CardSidebarReviews } from '../CardSidebarReviews'

type MockReviewComposerProps = {
	onCancel?: () => void
	onSuccess?: () => void
}

vi.mock('../../ReviewComposer', () => ({
	ReviewComposer: ({ onCancel, onSuccess }: MockReviewComposerProps) => (
		<div data-testid='review-composer'>
			<button onClick={onCancel} type='button'>
				Cancel
			</button>
			<button onClick={onSuccess} type='button'>
				Succeed
			</button>
		</div>
	),
}))

vi.mock('../CardReviewsPanel', () => ({
	CardReviewsPanel: () => <section>Reviews panel</section>,
}))

const cardId = 'card-1' as Id<'cards'>

describe('CardSidebarReviews', () => {
	it('opens the composer from the dedicated add action', async () => {
		const user = userEvent.setup()
		render(<CardSidebarReviews cardId={cardId} />)

		const action = screen.getByRole('button', { name: 'Add review' })
		expect(action).toHaveAttribute('aria-expanded', 'false')
		expect(screen.queryByTestId('review-composer')).not.toBeInTheDocument()
		expect(screen.getByText('Reviews panel')).toBeInTheDocument()

		await user.click(action)

		expect(
			screen.getByRole('button', { name: 'Close review composer' }),
		).toHaveAttribute('aria-expanded', 'true')
		expect(screen.getByTestId('review-composer')).toBeInTheDocument()
	})

	it('closes and restores focus after cancel', async () => {
		const user = userEvent.setup()
		render(<CardSidebarReviews cardId={cardId} />)

		await user.click(screen.getByRole('button', { name: 'Add review' }))
		await user.click(screen.getByRole('button', { name: 'Cancel' }))

		expect(screen.queryByTestId('review-composer')).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Add review' })).toHaveFocus()
	})

	it('closes and restores focus after successful creation', async () => {
		const user = userEvent.setup()
		render(<CardSidebarReviews cardId={cardId} />)

		await user.click(screen.getByRole('button', { name: 'Add review' }))
		await user.click(screen.getByRole('button', { name: 'Succeed' }))

		expect(screen.queryByTestId('review-composer')).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Add review' })).toHaveFocus()
	})

	it('discards the open composer when explicitly closed', async () => {
		const user = userEvent.setup()
		render(<CardSidebarReviews cardId={cardId} />)

		await user.click(screen.getByRole('button', { name: 'Add review' }))
		await user.click(
			screen.getByRole('button', { name: 'Close review composer' }),
		)

		expect(screen.queryByTestId('review-composer')).not.toBeInTheDocument()
	})
})
