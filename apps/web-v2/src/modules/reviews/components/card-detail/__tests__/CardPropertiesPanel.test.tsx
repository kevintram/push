import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CardPropertiesPanel } from '../CardPropertiesPanel'

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
