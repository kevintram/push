import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { HideModeProvider } from '../../hide-mode/HideModeProvider'
import { HideModeButton } from '../HideModeButton'

describe('HideModeButton', () => {
	beforeEach(() => {
		sessionStorage.clear()
	})

	it('is icon-only and toggles its accessible pressed state', async () => {
		const user = userEvent.setup()
		render(
			<HideModeProvider>
				<HideModeButton />
			</HideModeProvider>,
		)

		const hideButton = screen.getByRole('button', { name: 'Hide mode' })
		expect(hideButton).toHaveAttribute('aria-pressed', 'false')
		expect(hideButton.querySelectorAll('svg')).toHaveLength(1)
		expect(hideButton.textContent).toBe('')

		await user.click(hideButton)

		expect(hideButton).toHaveAttribute('aria-pressed', 'true')

		await user.click(hideButton)
		expect(hideButton).toHaveAttribute('aria-pressed', 'false')
	})

	it('shows "Hiding" with showLabel only while hide mode is on', async () => {
		const user = userEvent.setup()
		render(
			<HideModeProvider>
				<HideModeButton showLabel />
			</HideModeProvider>,
		)

		const hideButton = screen.getByRole('button', { name: 'Hide mode' })
		const icon = hideButton.querySelector('svg')
		expect(hideButton.textContent).toBe('')

		await user.click(hideButton)

		expect(hideButton).toHaveAttribute('aria-pressed', 'true')
		expect(hideButton.textContent).toBe('Hiding')
		// The same elements stay mounted, so toggling keeps focus and the icon.
		expect(hideButton).toHaveFocus()
		expect(hideButton.querySelector('svg')).toBe(icon)

		await user.click(hideButton)

		expect(hideButton.textContent).toBe('')
		expect(hideButton).toHaveFocus()
		expect(hideButton.querySelector('svg')).toBe(icon)
	})
})
