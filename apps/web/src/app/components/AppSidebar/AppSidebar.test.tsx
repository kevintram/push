import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppSidebar } from '~/app/components/AppSidebar/AppSidebar'
import { SidebarProvider } from '~/components/ui/sidebar'

const useLocationMock = vi.fn()
const useReviewCardQueueCountsMock = vi.fn()
const useReviewCardPinnedSummaryMock = vi.fn()
const useTopicsMock = vi.fn()
const useReviewModeMock = vi.fn()
const navigateMock = vi.fn()
const requestCreateTopicMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, to, ...props }: ComponentProps<'a'> & { to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useLocation: () => useLocationMock(),
	useNavigate: () => navigateMock
}))

vi.mock('@tanstack/react-router-devtools', () => ({
	TanStackRouterDevtools: () => null
}))

vi.mock('~/app/components/AppSidebar/SidebarSearch', () => ({
	SidebarSearch: () => null
}))

vi.mock('~/components/SettingsDialog', () => ({
	SettingsDialog: () => null
}))

vi.mock('~/features/review-cards/hooks/useReviewCardQueueCounts', () => ({
	useReviewCardQueueCounts: (...args: Array<unknown>) =>
		useReviewCardQueueCountsMock(...args)
}))

vi.mock('~/features/review-cards/api/getReviewCardPinnedSummary', () => ({
	useReviewCardPinnedSummary: (...args: Array<unknown>) =>
		useReviewCardPinnedSummaryMock(...args)
}))

vi.mock('~/features/topics/api/getTopics', () => ({
	useTopics: (...args: Array<unknown>) => useTopicsMock(...args)
}))

vi.mock('~/features/topics/createTopicIntent', () => ({
	requestCreateTopic: () => requestCreateTopicMock()
}))

vi.mock('~/stores/ReviewModeContext', () => ({
	useReviewMode: (...args: Array<unknown>) => useReviewModeMock(...args)
}))

describe('AppSidebar', () => {
	beforeEach(() => {
		useLocationMock.mockReset()
		useReviewCardQueueCountsMock.mockReset()
		useReviewCardPinnedSummaryMock.mockReset()
		useTopicsMock.mockReset()
		useReviewModeMock.mockReset()
		navigateMock.mockReset()
		requestCreateTopicMock.mockReset()
		useReviewCardPinnedSummaryMock.mockReturnValue({
			data: { pinned_count: 0 }
		})
		useReviewModeMock.mockReturnValue({
			reviewMode: 'off',
			setReviewMode: vi.fn(),
			isReviewModeEnabled: false,
			hidesPrimary: false,
			hidesSecondary: false,
			showReviewModeWarning: false,
			setShowReviewModeWarning: vi.fn(),
			autoEnableReviewMode: false,
			setAutoEnableReviewMode: vi.fn()
		})
	})

	it('renders practice and flashcard queue summaries in the sidebar', () => {
		useLocationMock.mockReturnValue({ pathname: '/practice' })
		useTopicsMock.mockReturnValue({ data: [] })
		useReviewCardQueueCountsMock.mockImplementation(
			({ type }: { type: 'practice' | 'flashcard' }) => {
				if (type === 'practice') {
					return {
						overdueCount: 2,
						dueTodayCount: 3,
						newCount: 4,
						dueNextSevenDaysCount: 5
					}
				}

				return {
					overdueCount: 1,
					dueTodayCount: 0,
					newCount: 7,
					dueNextSevenDaysCount: 2
				}
			}
		)
		useReviewCardPinnedSummaryMock.mockReturnValue({
			data: { pinned_count: 2 }
		})

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		const practiceLink = screen.getByRole('link', { name: /practice/i })
		const flashcardsLink = screen.getByRole('link', { name: /flashcards/i })
		const pinnedLink = screen.getByRole('link', { name: /pinned/i })

		expect(practiceLink).toHaveTextContent('Practice234')
		expect(practiceLink).not.toHaveTextContent('overdue')
		expect(practiceLink).not.toHaveTextContent('today')
		expect(practiceLink).not.toHaveTextContent('new')

		expect(flashcardsLink).toHaveTextContent('Flashcards17')
		expect(flashcardsLink).not.toHaveTextContent('overdue')
		expect(flashcardsLink).not.toHaveTextContent('today')
		expect(flashcardsLink).not.toHaveTextContent('new')
		expect(pinnedLink).toHaveTextContent('Pinned2')
	})

	it('hides pinned count badge when the summary query is unavailable', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
		useTopicsMock.mockReturnValue({ data: [] })
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})
		useReviewCardPinnedSummaryMock.mockReturnValue(undefined)

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		expect(screen.getByRole('link', { name: /pinned/i })).toHaveTextContent(
			'Pinned'
		)
		expect(screen.getByRole('link', { name: /pinned/i })).not.toHaveTextContent(
			'Pinned0'
		)
	})

	it('renders capped root topics with untitled fallback in the sidebar', () => {
		useLocationMock.mockReturnValue({ pathname: '/topics/2' })
		useTopicsMock.mockReturnValue({
			data: [
				{ id: 1, title: 'Alpha' },
				{ id: 2, title: '' },
				{ id: 3, title: 'Beta' },
				{ id: 4, title: 'Delta' },
				{ id: 5, title: 'Epsilon' },
				{ id: 6, title: 'Gamma' },
				{ id: 7, title: 'Eta' },
				{ id: 8, title: 'Iota' },
				{ id: 9, title: 'Kappa' },
				{ id: 10, title: 'Lambda' },
				{ id: 11, title: 'Mu' }
			]
		})
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		expect(screen.getByRole('link', { name: /topics/i })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Alpha' })).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'Untitled topic' })
		).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Lambda' })).toBeInTheDocument()
		expect(screen.queryByRole('link', { name: 'Mu' })).not.toBeInTheDocument()
	})

	it('does not mark the top-level topics item active on a topic detail route', () => {
		useLocationMock.mockReturnValue({ pathname: '/topics/2' })
		useTopicsMock.mockReturnValue({
			data: [
				{ id: 1, title: 'Alpha' },
				{ id: 2, title: 'Beta' }
			]
		})
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		expect(screen.getByRole('link', { name: /^Topics$/ })).not.toHaveAttribute(
			'data-active',
			'true'
		)
		expect(screen.getByRole('link', { name: 'Beta' })).toHaveAttribute(
			'data-active'
		)
	})

	it('renders an add topic action and navigates to topics when outside the topics routes', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
		useTopicsMock.mockReturnValue({ data: [] })
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		fireEvent.click(screen.getByRole('button', { name: 'Add topic' }))

		expect(requestCreateTopicMock).toHaveBeenCalledTimes(1)
		expect(navigateMock).toHaveBeenCalledWith({ to: '/topics' })
	})

	it('requests topic creation without leaving the current topics route', () => {
		useLocationMock.mockReturnValue({ pathname: '/topics/2' })
		useTopicsMock.mockReturnValue({ data: [] })
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		fireEvent.click(screen.getByRole('button', { name: 'Add topic' }))

		expect(requestCreateTopicMock).toHaveBeenCalledTimes(1)
		expect(navigateMock).not.toHaveBeenCalled()
	})

	it('orders top-level sidebar groups as review, activity, then library', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
		useTopicsMock.mockReturnValue({ data: [] })
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		const links = screen.getAllByRole('link')
		const topLevelLabels = links
			.map(link => link.textContent?.replace(/\d+$/, '').trim())
			.filter(label =>
				[
					'Recent',
					'Topics',
					'Logbook',
					'Practice',
					'Flashcards',
					'Pinned'
				].includes(label ?? '')
			)

		expect(topLevelLabels).toEqual([
			'Practice',
			'Flashcards',
			'Pinned',
			'Logbook',
			'Recent',
			'Topics'
		])
	})

	it('renders review mode ahead of settings in the footer', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
		useTopicsMock.mockReturnValue({ data: [] })
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})
		useReviewModeMock.mockReturnValue({
			reviewMode: 'on',
			setReviewMode: vi.fn(),
			isReviewModeEnabled: true,
			hidesPrimary: false,
			hidesSecondary: true,
			showReviewModeWarning: false,
			setShowReviewModeWarning: vi.fn(),
			autoEnableReviewMode: false,
			setAutoEnableReviewMode: vi.fn()
		})

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		const reviewModeHeading = screen.getByText('Review Mode')
		const reviewModeButton = screen.getByRole('button', {
			name: 'Review mode On'
		})
		const settingsButton = screen.getByRole('button', { name: /settings/i })

		expect(reviewModeHeading).toBeInTheDocument()
		expect(reviewModeButton).toBeInTheDocument()
		expect(
			screen.getByText('Hide stuff so you can guess stuff')
		).toBeInTheDocument()
		expect(settingsButton).toBeInTheDocument()
		expect(reviewModeHeading.compareDocumentPosition(settingsButton)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		)
	})

	it('updates review mode directly from the inline footer card', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
		useTopicsMock.mockReturnValue({ data: [] })
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})
		const setReviewMode = vi.fn()
		useReviewModeMock.mockReturnValue({
			reviewMode: 'off',
			setReviewMode,
			isReviewModeEnabled: false,
			hidesPrimary: false,
			hidesSecondary: false,
			showReviewModeWarning: false,
			setShowReviewModeWarning: vi.fn(),
			autoEnableReviewMode: false,
			setAutoEnableReviewMode: vi.fn()
		})

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		fireEvent.click(screen.getByRole('button', { name: 'Review mode On' }))

		expect(setReviewMode).toHaveBeenCalledWith('on')
	})

	it('shows the collapsed review mode button as active when review mode is on', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
		useTopicsMock.mockReturnValue({ data: [] })
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})
		useReviewModeMock.mockReturnValue({
			reviewMode: 'on',
			setReviewMode: vi.fn(),
			isReviewModeEnabled: true,
			hidesPrimary: false,
			hidesSecondary: true,
			showReviewModeWarning: false,
			setShowReviewModeWarning: vi.fn(),
			autoEnableReviewMode: false,
			setAutoEnableReviewMode: vi.fn()
		})

		render(
			<SidebarProvider defaultOpen={false}>
				<AppSidebar />
			</SidebarProvider>
		)

		expect(
			screen.getByRole('button', { name: 'Review Mode: On' })
		).toHaveAttribute('data-active')
	})
})
