import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const useThemeMock = vi.hoisted(() => vi.fn())
const useWeekStartMock = vi.hoisted(() => vi.fn())
const useReviewModeMock = vi.hoisted(() => vi.fn())

vi.mock('~/stores/ThemeContext', () => ({
	useTheme: useThemeMock
}))

vi.mock('~/stores/WeekStartContext', () => ({
	WEEK_START_OPTIONS: [
		{ value: 0, label: 'Sunday' },
		{ value: 1, label: 'Monday' }
	],
	useWeekStart: useWeekStartMock
}))

vi.mock('~/stores/ReviewModeContext', () => ({
	useReviewMode: useReviewModeMock
}))

vi.mock('~/components/ui/dialog', () => ({
	Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>
}))

vi.mock('~/components/ui/dropdown-menu', () => ({
	DropdownMenu: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuItem: ({
		children,
		onClick
	}: {
		children: ReactNode
		onClick?: () => void
	}) => (
		<button onClick={onClick} type='button'>
			{children}
		</button>
	),
	DropdownMenuTrigger: ({
		children,
		render
	}: {
		children: ReactNode
		render?: ReactNode
	}) => <div>{render ?? children}</div>
}))

import { SettingsDialog } from '~/components/SettingsDialog'

describe('SettingsDialog', () => {
	beforeEach(() => {
		useThemeMock.mockReset()
		useWeekStartMock.mockReset()
		useReviewModeMock.mockReset()
	})

	it('uses theme and setTheme from the local theme facade', async () => {
		const user = userEvent.setup()
		const setTheme = vi.fn()

		useThemeMock.mockReturnValue({
			resolvedTheme: 'dark',
			setTheme,
			theme: 'system'
		})
		useWeekStartMock.mockReturnValue({
			setWeekStartDay: vi.fn(),
			weekStartDay: 0
		})
		useReviewModeMock.mockReturnValue({
			showReviewModeWarning: true,
			setShowReviewModeWarning: vi.fn(),
			autoEnableReviewMode: false,
			setAutoEnableReviewMode: vi.fn()
		})

		render(<SettingsDialog onOpenChange={vi.fn()} open={true} />)

		expect(screen.getByRole('button', { name: 'System' })).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Light' }))

		expect(setTheme).toHaveBeenCalledWith('light')
	})
})
