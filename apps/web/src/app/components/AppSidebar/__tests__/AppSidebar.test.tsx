import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppSidebar } from '~/app/components/AppSidebar/AppSidebar'
import { SidebarProvider } from '~/components/ui/sidebar'

const useLocationMock = vi.fn()
const useReviewCardQueueCountsMock = vi.fn()
const useReviewCardFlaggedSummaryMock = vi.fn()
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

vi.mock('~/app/components/AppSidebar/AppSidebarTopicTree', () => ({
	AppSidebarTopicTree: () => <div data-testid='sidebar-topic-tree' />
}))

vi.mock('~/components/SettingsDialog', () => ({
	SettingsDialog: () => null
}))

vi.mock('~/features/review-cards/hooks/useReviewCardQueueCounts', () => ({
	useReviewCardQueueCounts: (...args: Array<unknown>) =>
		useReviewCardQueueCountsMock(...args)
}))

vi.mock('~/features/review-cards/api/getReviewCardFlaggedSummary', () => ({
	useReviewCardFlaggedSummary: (...args: Array<unknown>) =>
		useReviewCardFlaggedSummaryMock(...args)
}))

vi.mock('~/features/topics/createTopicIntent', () => ({
	requestCreateTopic: () => requestCreateTopicMock()
}))

describe('AppSidebar', () => {
	beforeEach(() => {
		useLocationMock.mockReset()
		useReviewCardQueueCountsMock.mockReset()
		useReviewCardFlaggedSummaryMock.mockReset()
		navigateMock.mockReset()
		requestCreateTopicMock.mockReset()
		useReviewCardFlaggedSummaryMock.mockReturnValue({
			data: { flagged_count: 0 }
		})
	})

	it('renders practice and flashcard queue summaries in the sidebar', () => {
		useLocationMock.mockReturnValue({ pathname: '/practice' })
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
		useReviewCardFlaggedSummaryMock.mockReturnValue({
			data: { flagged_count: 2 }
		})

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		const practiceLink = screen.getByRole('link', { name: /practice/iu })
		const flashcardsLink = screen.getByRole('link', { name: /flashcards/iu })
		const flaggedLink = screen.getByRole('link', { name: /flagged/iu })

		expect(practiceLink).toHaveTextContent('Practice234')
		expect(flashcardsLink).toHaveTextContent('Flashcards17')
		expect(flaggedLink).toHaveTextContent('Flagged2')
	})

	it('hides flagged count badge when the summary query is unavailable', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 0,
			dueTodayCount: 0,
			newCount: 0,
			dueNextSevenDaysCount: 0
		})
		useReviewCardFlaggedSummaryMock.mockReturnValue(undefined)

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		expect(screen.getByRole('link', { name: /flagged/iu })).toHaveTextContent(
			'Flagged'
		)
		expect(
			screen.getByRole('link', { name: /flagged/iu })
		).not.toHaveTextContent('Flagged0')
	})

	it('does not mark the top-level topics item active on a topic detail route', () => {
		useLocationMock.mockReturnValue({ pathname: '/topics/2' })
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

		expect(screen.getByRole('link', { name: /^Topics$/u })).not.toHaveAttribute(
			'data-active',
			'true'
		)
	})

	it('renders an add topic action and navigates to topics when outside the topics routes', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
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

	it('renders the global topic tree beneath the fixed navigation groups', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
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

		expect(screen.getByTestId('sidebar-topic-tree')).toBeInTheDocument()
	})

	it('orders top-level sidebar groups as review then library', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
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
			.map(link => link.textContent?.replace(/\d+$/u, '').trim())
			.filter(label =>
				['Practice', 'Flashcards', 'Flagged', 'Topics'].includes(label ?? '')
			)

		expect(topLevelLabels).toEqual([
			'Practice',
			'Flashcards',
			'Flagged',
			'Topics'
		])
	})

	it('does not render settings in the sidebar', () => {
		useLocationMock.mockReturnValue({ pathname: '/recent' })
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

		expect(
			screen.queryByRole('button', { name: /settings/iu })
		).not.toBeInTheDocument()
	})
})
