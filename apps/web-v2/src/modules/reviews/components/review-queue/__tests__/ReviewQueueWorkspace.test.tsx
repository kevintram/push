import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { DateString } from '~/types/date'

import { ReviewQueueWorkspace } from '../ReviewQueueWorkspace'

describe('ReviewQueueWorkspace', () => {
	it('starts with the queue open and toggles its visibility', async () => {
		const user = userEvent.setup()
		render(
			<ReviewQueueWorkspace
				cards={[]}
				title='Due'
				today={'2026-09-13' as DateString}
			/>,
		)

		const sidebar = screen.getByRole('complementary', { name: 'Due cards' })
		const hideButton = screen.getByRole('button', {
			name: 'Hide queue',
		})
		expect(sidebar).toHaveAttribute('id', 'review-queue-sidebar')
		expect(hideButton).toHaveAttribute('aria-expanded', 'true')
		expect(hideButton).toHaveAttribute(
			'aria-controls',
			'review-queue-sidebar',
		)

		await user.click(hideButton)

		const showButton = screen.getByRole('button', {
			name: 'Show queue',
		})
		expect(showButton).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('complementary', { name: 'Due cards' }),
		).not.toBeInTheDocument()

		await user.click(showButton)

		expect(
			screen.getByRole('complementary', { name: 'Due cards' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Hide queue' }),
		).toHaveAttribute('aria-expanded', 'true')
	})
})
