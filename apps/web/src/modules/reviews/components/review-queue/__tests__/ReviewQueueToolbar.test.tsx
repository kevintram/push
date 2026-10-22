import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TooltipProvider } from '~/components/ui'

import { ReviewQueueToolbar } from '../ReviewQueueToolbar'

describe('ReviewQueueToolbar', () => {
	it('does not render a redundant hide mode action', () => {
		const view = render(
			<TooltipProvider delay={0}>
				<ReviewQueueToolbar
					canGoPrevious={false}
					canGoNext
					queueSidebarOpen
					onPrevious={() => {}}
					onNext={() => {}}
					onQueueSidebarToggle={() => {}}
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

	it('exposes the queue state and controls the sidebar accessibly', () => {
		const view = render(
			<ReviewQueueToolbar
				canGoPrevious={false}
				canGoNext
				queueSidebarOpen
				onPrevious={() => {}}
				onNext={() => {}}
				onQueueSidebarToggle={() => {}}
			/>,
		)

		const toggle = screen.getByRole('button', {
			name: 'Close queue',
		})
		expect(toggle).toHaveAttribute('aria-expanded', 'true')
		expect(toggle).toHaveAttribute('aria-controls', 'review-queue-sidebar')

		view.rerender(
			<ReviewQueueToolbar
				canGoPrevious={false}
				canGoNext
				queueSidebarOpen={false}
				onPrevious={() => {}}
				onNext={() => {}}
				onQueueSidebarToggle={() => {}}
			/>,
		)

		const closedToggle = screen.getByRole('button', {
			name: 'Open queue',
		})
		expect(closedToggle).toHaveAttribute('aria-expanded', 'false')
		expect(closedToggle).toHaveAttribute(
			'aria-controls',
			'review-queue-sidebar',
		)
		view.unmount()
	})
})
