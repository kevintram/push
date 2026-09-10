import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import { CardMetadata } from '../CardMetadata'

/** Class names on the element labelled `label`, for tone comparisons. */
function classesOf(label: string): Array<string> {
	return screen.getByLabelText(label).className.split(' ')
}

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

	it('tones a review from today like a date due today', () => {
		render(
			<CardMetadata
				lastReviewedAt='2026-08-09'
				lastRating='good'
				nextDueAt='2026-08-09'
				retrievability={0.85}
				stability={10}
				today='2026-08-09'
			/>,
		)

		expect(classesOf('Good, reviewed Aug 9, 2026')).toEqual(
			expect.arrayContaining(
				screen.getByText('Due Today').className.split(' '),
			),
		)
	})

	it('leaves an earlier review untoned while the card is due today', () => {
		render(
			<CardMetadata
				lastReviewedAt='2026-08-01'
				lastRating='good'
				nextDueAt='2026-08-09'
				retrievability={0.85}
				stability={10}
				today='2026-08-09'
			/>,
		)

		expect(classesOf('Good, reviewed Aug 1, 2026')).not.toEqual(
			expect.arrayContaining(
				screen.getByText('Due Today').className.split(' '),
			),
		)
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

	it('shows the durability icon and explanation in a tooltip', async () => {
		const user = userEvent.setup()

		render(
			<TooltipProvider delay={0}>
				<CardMetadata
					lastReviewedAt='2026-08-01'
					lastRating='good'
					nextDueAt={null}
					retrievability={null}
					stability={10.4}
					today='2026-08-09'
				/>
			</TooltipProvider>,
		)

		const durability = screen.getByText(/Durability/)
		expect(durability).toHaveTextContent(/Durability.*10d/)
		expect(document.querySelector('svg.lucide-anvil')).toBeInTheDocument()
		await user.hover(durability)

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'Estimated you will remember this for at least 10d',
		)
	})
})
