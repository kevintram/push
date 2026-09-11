import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import { ReviewQueueToolbar } from '../ReviewQueueToolbar'

describe('ReviewQueueToolbar', () => {
	it('does not render a redundant hide mode action', () => {
		const view = render(
			<TooltipProvider delay={0}>
				<ReviewQueueToolbar
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
		expect(
			screen.queryByRole('link', { name: 'Go to card' }),
		).not.toBeInTheDocument()
		view.unmount()
	})
})
