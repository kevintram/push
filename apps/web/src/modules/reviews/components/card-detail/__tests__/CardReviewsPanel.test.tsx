import type { Id } from '@convex/_generated/dataModel'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CardReviewsPanel } from '../CardReviewsPanel'

vi.mock('@tanstack/react-query', () => ({
	useSuspenseQuery: () => ({ data: [] }),
}))
vi.mock('../../../api/reviewQueries', () => ({
	reviewQueries: { listByCard: () => ({ queryKey: ['reviews'] }) },
}))
vi.mock('../../ReviewList', () => ({ ReviewList: () => null }))

describe('CardReviewsPanel', () => {
	it('shows all reviews in place instead of navigating', () => {
		const onSeeAll = vi.fn()
		render(
			<CardReviewsPanel
				cardId={'card-1' as Id<'cards'>}
				onSeeAll={onSeeAll}
			/>,
		)

		expect(
			screen.queryByRole('link', { name: 'See all' }),
		).not.toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: 'See all' }))
		expect(onSeeAll).toHaveBeenCalledOnce()
	})
})
