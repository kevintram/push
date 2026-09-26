import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HideModeProvider } from '~/modules/reviews/hide-mode/HideModeProvider'
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'

import { AppShell } from '../AppShell'

vi.mock('../AppSidebar', () => ({
	AppSidebar: () => <nav aria-label='primary' />,
}))

function HideModeToggle() {
	const { toggleHideMode } = useHideMode()

	return <button onClick={toggleHideMode}>Toggle hide mode</button>
}

describe('AppShell', () => {
	it('marks the shell when hide mode is enabled and removes it when disabled', () => {
		sessionStorage.setItem('hideMode', 'off')
		render(
			<HideModeProvider>
				<HideModeToggle />
				<AppShell>
					<div>Main content</div>
				</AppShell>
			</HideModeProvider>,
		)

		const shell = screen.getByRole('main').parentElement
		expect(shell).toHaveAttribute('data-hide-mode', 'off')

		fireEvent.click(
			screen.getByRole('button', { name: 'Toggle hide mode' }),
		)
		expect(shell).toHaveAttribute('data-hide-mode', 'on')

		fireEvent.click(
			screen.getByRole('button', { name: 'Toggle hide mode' }),
		)
		expect(shell).toHaveAttribute('data-hide-mode', 'off')
	})
})
