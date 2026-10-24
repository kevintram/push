import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Review } from '../../types/review.types'
import { ReviewList } from '../ReviewList'

vi.mock('../Review', () => ({
	Review: ({ review }: { review: Review }) => (
		<tr>
			<td>{review.description}</td>
		</tr>
	),
}))

function review(id: string, description: string): Review {
	return {
		_creationTime: 0,
		_id: id as Id<'reviews'>,
		cardId: 'card-1' as Id<'cards'>,
		description,
		notes: '',
		ownerId: 'user-1',
	} as Review
}

describe('ReviewList', () => {
	it('renders a row for each review', () => {
		render(
			<ReviewList
				reviews={[
					review('review-1', 'Explain the Krebs cycle.'),
					review('review-2', 'Describe ATP synthesis.'),
				]}
			/>,
		)

		const [, ...rows] = screen.getAllByRole('row')
		expect(rows.map(row => row.textContent)).toEqual([
			'Explain the Krebs cycle.',
			'Describe ATP synthesis.',
		])
	})

	it('names every column', () => {
		render(<ReviewList reviews={[review('review-1', 'A review')]} />)

		expect(
			screen.getAllByRole('columnheader').map(cell => cell.textContent),
		).toEqual(['Rating', 'Description', 'Date', 'Strength', 'Actions'])
	})
})
