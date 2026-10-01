import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import type { Review } from '../../types/review.types'
import { ReviewDurability } from '../ReviewDurability'

const review = {
	_creationTime: 0,
	_id: 'review-1' as Id<'reviews'>,
	cardId: 'card-1' as Id<'cards'>,
	description: '',
	notes: '',
	ownerId: 'user-1',
	rating: 'good',
	stabilityAfter: 10.4,
	stabilityBefore: 8,
} as Review

describe('ReviewDurability', () => {
	it('shows the durability explanation in a tooltip', async () => {
		const user = userEvent.setup()

		render(
			<TooltipProvider delay={0}>
				<ReviewDurability review={review} />
			</TooltipProvider>,
		)

		expect(document.querySelector('svg.lucide-anvil')).toBeInTheDocument()
		await user.hover(screen.getByText('10d'))

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'Estimated you will remember this for at least 10d',
		)
	})
})
