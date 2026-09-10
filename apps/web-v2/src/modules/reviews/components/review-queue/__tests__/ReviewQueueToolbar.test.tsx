import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '~/components/ui'
import type { Card } from '~/modules/reviews/types/review.types'

import { ReviewQueueToolbar } from '../ReviewQueueToolbar'

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children }: { children?: ReactNode }) => <a>{children}</a>,
}))

const currentCard = { _id: 'card-1' } as Card

describe('ReviewQueueToolbar', () => {
	it('does not render a redundant hide mode action', () => {
		const view = render(
			<TooltipProvider delay={0}>
				<ReviewQueueToolbar
					currentCard={currentCard}
					index={0}
					cardCount={2}
					onPrevious={() => {}}
					onNext={() => {}}
				/>
			</TooltipProvider>,
		)

		expect(
			screen.queryByRole('button', { name: 'Toggle hide mode' }),
		).not.toBeInTheDocument()
		view.unmount()
	})
})
