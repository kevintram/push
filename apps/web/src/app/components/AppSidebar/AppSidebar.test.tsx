import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AppSidebar } from '~/app/components/AppSidebar/AppSidebar'
import { SidebarProvider } from '~/components/ui/sidebar'

const useLocationMock = vi.fn()
const useReviewCardQueueCountsMock = vi.fn()

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

describe('AppSidebar', () => {
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
})
