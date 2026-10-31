import type { Id } from '@convex/_generated/dataModel'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Review } from '../../../types/review.types'
import { CardReviewsPanel } from '../CardReviewsPanel'

const query = vi.hoisted(() => ({ data: [] as Array<Partial<Review>> }))

vi.mock('@tanstack/react-query', () => ({
	useSuspenseQuery: () => query,
}))
vi.mock('../../../api/reviewQueries', () => ({
	reviewQueries: { listByCard: () => ({ queryKey: ['reviews'] }) },
}))
vi.mock('@tanstack/react-router', () => ({
	Link: ({
		children,
		to,
		params,
	}: {
		children: React.ReactNode
		to: string
		params: { cardId: string }
	}) => <a href={to.replace('$cardId', params.cardId)}>{children}</a>,
}))
vi.mock('../../ReviewList', () => ({
	ReviewList: ({ reviews }: { reviews: Array<Review> }) => (
		<ul>
			{reviews.map(review => (
				<li key={review._id}>{review._id}</li>
			))}
		</ul>
	),
}))

function review(id: string, date?: string): Partial<Review> {
	return { _id: id as Id<'reviews'>, date }
}

// Newest first, matching the order `listByCard` returns.
const dated = [
	review('d4', '2026-04-01'),
	review('d3', '2026-03-01'),
	review('d2', '2026-02-01'),
	review('d1', '2026-01-01'),
]
const undated = review('undated')

function renderPanel(onSeeAll?: () => void) {
	render(
		<CardReviewsPanel
			cardId={'card-1' as Id<'cards'>}
			onSeeAll={onSeeAll}
		/>,
	)
}

function shownIds() {
	return screen.queryAllByRole('listitem').map(item => item.textContent)
}

describe('CardReviewsPanel', () => {
	it('shows the three most recent dated reviews', () => {
		query.data = [undated, ...dated]
		renderPanel()

		expect(shownIds()).toEqual(['d4', 'd3', 'd2'])
		expect(
			screen.getByRole('link', { name: 'See all' }),
		).toBeInTheDocument()
	})

	it('places "See all" after the reviews', () => {
		query.data = dated
		renderPanel()

		const list = screen.getByRole('list')
		const seeAll = screen.getByRole('link', { name: 'See all' })
		expect(
			list.compareDocumentPosition(seeAll) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy()
	})

	it('hides "See all" when every review is shown', () => {
		query.data = dated.slice(1)
		renderPanel(vi.fn())

		expect(shownIds()).toEqual(['d3', 'd2', 'd1'])
		expect(screen.queryByText('See all')).not.toBeInTheDocument()
	})

	it('shows "See all" when only undated reviews are hidden', () => {
		query.data = [undated, ...dated.slice(3)]
		renderPanel()

		expect(shownIds()).toEqual(['d1'])
		expect(
			screen.getByRole('link', { name: 'See all' }),
		).toBeInTheDocument()
	})

	it('shows all reviews in place instead of navigating', () => {
		query.data = dated
		const onSeeAll = vi.fn()
		renderPanel(onSeeAll)

		expect(
			screen.queryByRole('link', { name: 'See all' }),
		).not.toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: 'See all' }))
		expect(onSeeAll).toHaveBeenCalledOnce()
	})

	it("links the title to the card's reviews", () => {
		query.data = dated.slice(1)
		renderPanel()

		expect(screen.getByRole('link', { name: 'Reviews' })).toHaveAttribute(
			'href',
			'/cards/card-1/reviews',
		)
	})

	it('shows all reviews in place from the title', () => {
		query.data = dated.slice(1)
		const onSeeAll = vi.fn()
		renderPanel(onSeeAll)

		expect(
			screen.queryByRole('link', { name: 'Reviews' }),
		).not.toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: 'Reviews' }))
		expect(onSeeAll).toHaveBeenCalledOnce()
	})
})
