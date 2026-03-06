import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AppSidebar } from '~/app/components/AppSidebar/AppSidebar'
import { SidebarProvider } from '~/components/ui/sidebar'

const useLocationMock = vi.fn()
const useReviewCardQueueCountsMock = vi.fn()
const useTopicsMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, to, ...props }: ComponentProps<'a'> & { to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useLocation: () => useLocationMock()
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

vi.mock('~/features/topics/api/getTopics', () => ({
	useTopics: (...args: Array<unknown>) => useTopicsMock(...args)
}))

describe('AppSidebar', () => {
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

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>
		)

		const practiceLink = screen.getByRole('link', { name: /practice/i })
		const flashcardsLink = screen.getByRole('link', { name: /flashcards/i })

		expect(practiceLink).toHaveTextContent('Practice234')
		expect(practiceLink).not.toHaveTextContent('overdue')
		expect(practiceLink).not.toHaveTextContent('today')
		expect(practiceLink).not.toHaveTextContent('new')

		expect(flashcardsLink).toHaveTextContent('Flashcards17')
		expect(flashcardsLink).not.toHaveTextContent('overdue')
		expect(flashcardsLink).not.toHaveTextContent('today')
		expect(flashcardsLink).not.toHaveTextContent('new')
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
			.map(link => link.textContent)
			.filter(label =>
				['Recent', 'Topics', 'Logbook', 'Practice', 'Flashcards'].includes(
					label ?? ''
				)
			)

		expect(topLevelLabels).toEqual([
			'Practice',
			'Flashcards',
			'Logbook',
			'Recent',
			'Topics'
		])
	})
})
