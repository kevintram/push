import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppHeader } from '~/app/components/AppHeader'

const useLocationMock = vi.fn()
const useReviewModeMock = vi.fn()
const useReviewCardQueueCountsMock = vi.fn()
const useReviewCardFlaggedSummaryMock = vi.fn()
const setReviewModeMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, to, ...props }: ComponentProps<'a'> & { to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useLocation: () => useLocationMock()
}))

vi.mock('~/features/search/components/search-dialog/SearchDialog', () => ({
	SearchDialog: ({
		open
	}: {
		open: boolean
		onOpenChange: (open: boolean) => void
		query: string
		setQuery: (value: string) => void
	}) => (open ? <div data-testid='search-dialog' /> : null)
}))

vi.mock('~/components/SettingsDialog', () => ({
	SettingsDialog: ({
		open,
		children
	}: {
		open: boolean
		onOpenChange: (open: boolean) => void
		children?: ReactNode
	}) => (open ? <div data-testid='settings-dialog'>{children}</div> : null)
}))

vi.mock('~/components/ui/tooltip', () => ({
	Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
	TooltipTrigger: ({
		render,
		children
	}: {
		render?: ReactNode
		children?: ReactNode
	}) => <>{render ?? children}</>,
	TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>
}))

vi.mock('~/stores/ReviewModeContext', () => ({
	useReviewMode: () => useReviewModeMock()
}))

vi.mock('~/features/review-cards/hooks/useReviewCardQueueCounts', () => ({
	useReviewCardQueueCounts: (...args: Array<unknown>) =>
		useReviewCardQueueCountsMock(...args)
}))

vi.mock('~/features/review-cards/api/getReviewCardFlaggedSummary', () => ({
	useReviewCardFlaggedSummary: (...args: Array<unknown>) =>
		useReviewCardFlaggedSummaryMock(...args)
}))

vi.mock('~/components/ui/sidebar', () => ({
	SidebarTrigger: (props: ComponentProps<'button'>) => (
		<button {...props}>Toggle Sidebar</button>
	)
}))

describe('AppHeader', () => {
	beforeEach(() => {
		useLocationMock.mockReset()
		useReviewModeMock.mockReset()
		useReviewCardQueueCountsMock.mockReset()
		useReviewCardFlaggedSummaryMock.mockReset()
		setReviewModeMock.mockReset()
		Object.defineProperty(window.navigator, 'platform', {
			configurable: true,
			value: 'MacIntel'
		})

		useLocationMock.mockReturnValue({ pathname: '/topics' })
		useReviewModeMock.mockReturnValue({
			reviewMode: 'off',
			setReviewMode: setReviewModeMock
		})
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})
		useReviewCardFlaggedSummaryMock.mockReturnValue({
			data: { flagged_count: 0 }
		})
	})

	it('opens settings from the header actions', () => {
		render(<AppHeader />)

		expect(screen.queryByTestId('settings-dialog')).not.toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

		expect(screen.getByTestId('settings-dialog')).toBeInTheDocument()
	})

	it('renders recent to the left of logbook in the header actions', () => {
		render(<AppHeader />)

		const dueButton = screen.getByRole('button', { name: 'Due' })
		const flaggedButton = screen.getByRole('button', { name: 'Flagged' })
		const recentButton = screen.getByRole('button', { name: 'Recent' })
		const logbookButton = screen.getByRole('button', { name: 'Logbook' })

		expect(dueButton).toHaveAttribute('href', '/due')
		expect(flaggedButton).toHaveAttribute('href', '/flagged')
		expect(useReviewCardQueueCountsMock).toHaveBeenCalledWith({
			filter: 'all'
		})
		expect(
			recentButton.compareDocumentPosition(logbookButton) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy()
	})

	it('renders due and flagged status dots on the header nav buttons', () => {
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 2,
			dueTodayCount: 3,
			newCount: 4,
			dueNextSevenDaysCount: 5
		})
		useReviewCardFlaggedSummaryMock.mockReturnValue({
			data: { flagged_count: 6 }
		})

		render(<AppHeader />)

		expect(screen.getByTestId('header-due-overdue-dot')).toBeInTheDocument()
		expect(screen.getByTestId('header-due-due-today-dot')).toBeInTheDocument()
		expect(screen.getByTestId('header-due-pending-dot')).toBeInTheDocument()
		expect(screen.getByTestId('header-flagged-pending-dot')).toBeInTheDocument()
	})

	it('renders the sidebar trigger in the header', () => {
		render(<AppHeader />)

		expect(
			screen.getByRole('button', { name: 'Toggle Sidebar' })
		).toBeInTheDocument()
	})

	it('renders the search trigger with outline styling and review mode next to it', () => {
		render(<AppHeader />)

		const searchButton = screen.getByRole('button', { name: 'Open search' })

		expect(searchButton).toHaveClass('border', 'border-border', 'bg-background')
		expect(searchButton).toHaveTextContent('Search')
		expect(searchButton).toHaveTextContent('⌘')
		expect(searchButton).toHaveTextContent('K')
		expect(
			screen.getByText('Hide answers and test your recall')
		).toBeInTheDocument()
		expect(screen.getByText('R')).toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: 'Review mode off' }))

		expect(setReviewModeMock).toHaveBeenCalledWith('on')
	})

	it('renders the search shortcut with ctrl on windows', () => {
		Object.defineProperty(window.navigator, 'platform', {
			configurable: true,
			value: 'Win32'
		})

		render(<AppHeader />)

		const searchButton = screen.getByRole('button', { name: 'Open search' })
		expect(searchButton).toHaveTextContent('Ctrl')
		expect(searchButton).toHaveTextContent('K')
		expect(searchButton).not.toHaveTextContent('⌘')
	})

	it('toggles review mode when pressing r outside editable fields', () => {
		render(<AppHeader />)

		fireEvent.keyDown(document, { key: 'r' })

		expect(setReviewModeMock).toHaveBeenCalledWith('on')
	})

	it('does not toggle review mode when pressing r in an input', () => {
		render(
			<>
				<input aria-label='Test input' />
				<AppHeader />
			</>
		)

		const input = screen.getByRole('textbox', { name: 'Test input' })
		input.focus()
		fireEvent.keyDown(input, { key: 'r' })

		expect(setReviewModeMock).not.toHaveBeenCalled()
	})
})
