import {
	act,
	render,
	renderHook,
	screen,
	waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { toast, Toaster } from '~/components/ui/Toast'

import { HideModeProvider } from '../HideModeProvider'
import { useHideMode } from '../useHideMode'

function HideModeWrapper({ children }: { children: ReactNode }) {
	return <HideModeProvider>{children}</HideModeProvider>
}

function renderWithToaster() {
	render(<Toaster />)
	return renderHook(useHideMode, { wrapper: HideModeWrapper })
}

async function expectToastClosed() {
	await waitFor(() =>
		expect(screen.queryByText('Hide mode on')).not.toBeInTheDocument(),
	)
}

describe('HideMode', () => {
	beforeEach(() => {
		sessionStorage.clear()
	})

	afterEach(() => {
		act(() => toast.close())
	})

	it('defaults to off when no value is stored', () => {
		const { result } = renderHook(useHideMode, {
			wrapper: HideModeWrapper,
		})

		expect(result.current.hideMode).toBe('off')
	})

	it.each([
		['off', 'off'],
		['on', 'on'],
	] as const)('parses a stored value of %s', (storedValue, expectedValue) => {
		sessionStorage.setItem('hideMode', storedValue)

		const { result } = renderHook(useHideMode, {
			wrapper: HideModeWrapper,
		})

		expect(result.current.hideMode).toBe(expectedValue)
	})

	it('updates the value and session storage', () => {
		const { result } = renderHook(useHideMode, {
			wrapper: HideModeWrapper,
		})

		act(() => {
			result.current.setHideMode('on')
		})

		expect(result.current.hideMode).toBe('on')
		expect(sessionStorage.getItem('hideMode')).toBe('on')
	})

	it('turns on with a toast that shows the hotkey', () => {
		const { result } = renderWithToaster()

		act(() => result.current.autoEnableHideMode())

		expect(result.current.hideMode).toBe('on')
		expect(screen.getByText('Hide mode on')).toBeInTheDocument()
		const button = screen.getByRole('button', { name: 'Turn off' })
		expect(button).toHaveAttribute('aria-keyshortcuts', 'Shift+R')
	})

	it('turns off and closes the toast from its button', async () => {
		const { result } = renderWithToaster()
		act(() => result.current.autoEnableHideMode())

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Turn off' }))

		expect(result.current.hideMode).toBe('off')
		await expectToastClosed()
	})

	it('closes the toast when toggled elsewhere', async () => {
		const { result } = renderWithToaster()
		act(() => result.current.autoEnableHideMode())

		act(() => result.current.toggleHideMode())

		expect(result.current.hideMode).toBe('off')
		await expectToastClosed()
	})

	it('closes the toast when set directly', async () => {
		const { result } = renderWithToaster()
		act(() => result.current.autoEnableHideMode())

		act(() => result.current.setHideMode('off'))

		await expectToastClosed()
	})

	it('throws when used outside the provider', () => {
		expect(() => renderHook(useHideMode)).toThrow(
			'useHideMode must be used inside HideModeProvider!',
		)
	})
})
