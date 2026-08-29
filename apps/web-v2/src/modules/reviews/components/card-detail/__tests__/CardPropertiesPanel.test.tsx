import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CardPropertiesPanel } from '../CardPropertiesPanel'

describe('CardPropertiesPanel', () => {
	it('shows due, freshness, and durability without last-reviewed metadata', () => {
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
		expect(screen.getByText('Hazy')).toBeInTheDocument()
		expect(screen.getByText('10 days')).toBeInTheDocument()
		expect(screen.queryByText('8d ago')).not.toBeInTheDocument()
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
		expect(screen.getAllByText('—')).toHaveLength(2)
	})
})
