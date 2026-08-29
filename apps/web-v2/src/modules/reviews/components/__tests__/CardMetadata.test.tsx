import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CardMetadata } from '../CardMetadata'

describe('CardMetadata', () => {
	it('shows the persisted SRS due date for a reviewed card', () => {
		render(
			<CardMetadata
				lastReviewedAt='2026-08-01'
				lastRating='good'
				nextDueAt='2026-08-10'
				retrievability={0.85}
				stability={10}
				today='2026-08-09'
			/>,
		)

		expect(screen.getByText('Due Tomorrow')).toBeInTheDocument()
		expect(screen.getByText('8d ago')).toBeInTheDocument()
	})

	it.each([
		['miss', 'Miss', 'x'],
		['hard', 'Hard', 'construction'],
		['good', 'Good', 'check'],
		['easy', 'Easy', 'check-check'],
	] as const)(
		'renders the %s rating icon',
		(lastRating, ratingLabel, iconName) => {
			render(
				<CardMetadata
					lastReviewedAt='2026-08-01'
					lastRating={lastRating}
					nextDueAt={null}
					retrievability={null}
					stability={null}
					today='2026-08-09'
				/>,
			)

			expect(
				document.querySelector(`svg.lucide-${iconName}`),
			).toBeInTheDocument()
			expect(
				screen.getByLabelText(`${ratingLabel}, reviewed Aug 1, 2026`),
			).toBeInTheDocument()
		},
	)

	it('renders unreviewed cards without a rating icon', () => {
		render(
			<CardMetadata
				lastReviewedAt={null}
				lastRating={null}
				nextDueAt={null}
				retrievability={null}
				stability={null}
				today='2026-08-09'
			/>,
		)

		expect(screen.getByText('Unreviewed')).toBeInTheDocument()
		expect(document.querySelector('svg')).not.toBeInTheDocument()
	})
})
