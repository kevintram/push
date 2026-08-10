import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ReviewCardMetadata } from '../ReviewCardMetadata'

describe('ReviewCardMetadata', () => {
	it('shows the persisted SRS due date for a reviewed card', () => {
		render(
			<ReviewCardMetadata
				lastReviewedAt='2026-08-01'
				nextDueAt='2026-08-10'
				retrievability={0.85}
				stability={10}
				today='2026-08-09'
			/>,
		)

		expect(screen.getByText('Due Tomorrow')).toBeInTheDocument()
		expect(screen.getByText('8d ago')).toBeInTheDocument()
	})
})
