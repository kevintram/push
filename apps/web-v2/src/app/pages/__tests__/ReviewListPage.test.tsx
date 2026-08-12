import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ReviewListPage } from '../ReviewListPage'

describe('ReviewListPage', () => {
	it('opens focus mode and restores focus when it closes', async () => {
		const user = userEvent.setup()

		render(
			<ReviewListPage reviewCards={[]} title='Due' today='2026-08-12' />,
		)
		const trigger = screen.getByRole('button', { name: 'Focus' })

		await user.click(trigger)

		expect(
			screen.getByRole('dialog', { name: 'FOCUS MODE' }),
		).toBeInTheDocument()

		await user.keyboard('{Escape}')

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		expect(trigger).toHaveFocus()
	})
})
