import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CardPropertiesPanel } from '../CardPropertiesPanel'

/** Class names on the element labelled `label`, for tone comparisons. */
function classesOf(label: string): Array<string> {
	return screen.getByLabelText(label).className.split(' ')
}

describe('CardPropertiesPanel', () => {
	it('shows due, recall, reviewed, and durability', () => {
		render(
			<CardPropertiesPanel
				lastReviewedAt='2026-08-16'
				lastRating='good'
				nextDueAt='2026-08-26'
				retrievability={0.8}
				stability={10.4}
				today='2026-08-24'
			/>,
		)

		expect(
			screen.getByRole('region', { name: 'Properties' }),
		).toBeInTheDocument()
		expect(screen.getByText('in 2d')).toBeInTheDocument()
		expect(screen.getByText('80%')).toBeInTheDocument()
		expect(screen.getByText('10d')).toBeInTheDocument()
		expect(
			screen.getByLabelText('Good, reviewed Aug 16, 2026'),
		).toHaveTextContent('8d ago')
	})

	it('marks an overdue due date', () => {
		render(
			<CardPropertiesPanel
				lastReviewedAt='2026-08-16'
				lastRating='good'
				nextDueAt='2026-08-22'
				retrievability={0.8}
				stability={10.4}
				today='2026-08-24'
			/>,
		)

		expect(screen.getByText('2d ago')).toBeInTheDocument()
	})

	it('tones a review from today like a date due today', () => {
		render(
			<CardPropertiesPanel
				lastReviewedAt='2026-08-24'
				lastRating='good'
				nextDueAt='2026-08-24'
				retrievability={0.8}
				stability={10.4}
				today='2026-08-24'
			/>,
		)

		// Both rows read "Today", and the due row renders first.
		const dueValue = screen.getAllByText('Today')[0]!

		expect(classesOf('Good, reviewed Aug 24, 2026')).toEqual(
			expect.arrayContaining(dueValue.className.split(' ')),
		)
	})

	it('leaves an earlier review untoned while the card is due today', () => {
		render(
			<CardPropertiesPanel
				lastReviewedAt='2026-08-16'
				lastRating='good'
				nextDueAt='2026-08-24'
				retrievability={0.8}
				stability={10.4}
				today='2026-08-24'
			/>,
		)

		expect(classesOf('Good, reviewed Aug 16, 2026')).not.toEqual(
			expect.arrayContaining(
				screen.getByText('Today').className.split(' '),
			),
		)
	})

	it('shows empty property values for an unreviewed card', () => {
		render(
			<CardPropertiesPanel
				lastReviewedAt={null}
				lastRating={null}
				nextDueAt={null}
				retrievability={null}
				stability={null}
				today='2026-08-24'
			/>,
		)

		expect(screen.getByText('Unscheduled')).toBeInTheDocument()
		expect(screen.getAllByText('—')).toHaveLength(3)
	})
})
