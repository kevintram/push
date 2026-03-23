import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type MockNextThemesProviderProps = {
	attribute?: string
	children: ReactNode
	defaultTheme?: string
	enableSystem?: boolean
	storageKey?: string
}

const mockUseNextTheme = vi.hoisted(() => vi.fn())
const mockNextThemesProvider = vi.hoisted(() =>
	vi.fn(({ children }: MockNextThemesProviderProps) => <>{children}</>)
)

vi.mock('next-themes', () => ({
	ThemeProvider: mockNextThemesProvider,
	useTheme: mockUseNextTheme
}))

import { ThemeProvider, useTheme } from '~/stores/ThemeContext'

function ThemeProbe() {
	const { theme, resolvedTheme, systemTheme, setTheme } = useTheme()

	return (
		<div>
			<div data-testid='theme'>{theme ?? 'unset'}</div>
			<div data-testid='resolved-theme'>{resolvedTheme ?? 'unset'}</div>
			<div data-testid='system-theme'>{systemTheme ?? 'unset'}</div>
			<button onClick={() => setTheme('light')} type='button'>
				Set light
			</button>
		</div>
	)
}

describe('ThemeContext', () => {
	beforeEach(() => {
		mockNextThemesProvider.mockClear()
		mockUseNextTheme.mockReset()
	})

	it('configures next-themes for class-based system theming', () => {
		render(
			<ThemeProvider defaultTheme='dark' storageKey='custom-theme-key'>
				<div>Child content</div>
			</ThemeProvider>
		)

		expect(screen.getByText('Child content')).toBeInTheDocument()
		expect(mockNextThemesProvider).toHaveBeenCalledTimes(1)

		const props = mockNextThemesProvider.mock
			.calls[0]?.[0] as MockNextThemesProviderProps
		expect(props.attribute).toBe('class')
		expect(props.defaultTheme).toBe('dark')
		expect(props.enableSystem).toBe(true)
		expect(props.storageKey).toBe('custom-theme-key')
	})

	it('uses the app defaults when theme props are omitted', () => {
		render(
			<ThemeProvider>
				<div>Child content</div>
			</ThemeProvider>
		)

		const props = mockNextThemesProvider.mock
			.calls[0]?.[0] as MockNextThemesProviderProps
		expect(props.defaultTheme).toBe('system')
		expect(props.storageKey).toBe('vite-ui-theme')
		expect(props.enableSystem).toBe(true)
	})

	it('re-exports next-themes hook values through the local facade', async () => {
		const user = userEvent.setup()
		const setTheme = vi.fn()

		mockUseNextTheme.mockReturnValue({
			forcedTheme: undefined,
			resolvedTheme: 'dark',
			setTheme,
			systemTheme: 'dark',
			theme: 'system',
			themes: ['dark', 'light', 'system']
		})

		render(<ThemeProbe />)

		expect(screen.getByTestId('theme')).toHaveTextContent('system')
		expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
		expect(screen.getByTestId('system-theme')).toHaveTextContent('dark')

		await user.click(screen.getByRole('button', { name: 'Set light' }))

		expect(setTheme).toHaveBeenCalledWith('light')
	})
})
