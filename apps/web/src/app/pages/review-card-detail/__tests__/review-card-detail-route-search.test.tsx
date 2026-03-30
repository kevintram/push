import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeTree } from '~/app/routeTree.gen'

const useReviewCardMock = vi.fn()
const useTopicMock = vi.fn()
const useReviewsByReviewCardMock = vi.fn()

vi.mock('~/components/SettingsDialog', () => ({
	SettingsDialog: () => null
}))

vi.mock('~/components/ui/dropdown-menu', async () => {
	const React = await import('react')

	return {
		DropdownMenu: ({ children }: { children: ReactNode }) => (
			<div>{children}</div>
		),
		DropdownMenuTrigger: ({
			render,
			children,
			...props
		}: {
			render?: ReactElement
			children?: ReactNode
		}) =>
			render ? (
				React.cloneElement(
					render,
					props,
					children ??
						(render as ReactElement<{ children?: ReactNode }>).props.children
				)
			) : (
				<button type='button' {...props}>
					{children}
				</button>
			),
		DropdownMenuContent: ({ children }: { children: ReactNode }) => (
			<div>{children}</div>
		),
		DropdownMenuItem: ({
			children,
			onClick,
			disabled
		}: {
			children: ReactNode
			onClick?: () => void
			disabled?: boolean
		}) => (
			<button disabled={disabled} onClick={onClick} type='button'>
				{children}
			</button>
		)
	}
})

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

vi.mock('~/features/reviews/components/ReviewItem', () => ({
	ReviewItem: ({ entry }: { entry: { description?: string | null } }) => (
		<div>{entry.description ?? 'Review item'}</div>
	)
}))

vi.mock('~/features/reviews/components/ReviewListHeader', () => ({
	ReviewListHeader: () => null
}))

vi.mock('~/features/reviews/components/RatingDropdown', () => ({
	RatingDropdown: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>
}))

vi.mock('~/features/reviews/components/reviews-menu/ReviewsMenu', () => ({
	ReviewsMenu: () => <button type='button'>Reviews</button>
}))

vi.mock('~/features/search/components/search-dialog/SearchDialog', () => ({
	SearchDialog: () => null
}))

vi.mock('~/features/review-cards/api/getReviewCard', () => ({
	useReviewCard: (...args: Array<unknown>) => useReviewCardMock(...args)
}))

vi.mock('~/features/topics/api/getTopic', () => ({
	useTopic: (...args: Array<unknown>) => useTopicMock(...args)
}))

vi.mock('~/features/reviews/api/getReviews', () => ({
	useReview: () => ({
		data: null,
		isLoading: false,
		error: null
	}),
	useReviewsByReviewCard: (...args: Array<unknown>) =>
		useReviewsByReviewCardMock(...args)
}))

vi.mock('~/features/review-cards/api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/topics/api/createTopic', () => ({
	useCreateTopic: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/review-cards/api/deleteReviewCard', () => ({
	useDeleteReviewCard: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/reviews/api/createReview', () => ({
	useCreateReview: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/reviews/hooks/useDetailReviewCounts', () => ({
	useDetailReviewCounts: () => ({
		unscheduledCount: 1,
		overdueCount: 0,
		dueTodayCount: 0
	})
}))

vi.mock('~/features/reviews/hooks/useReviewDialog', () => ({
	useReviewDialog: () => ({ openReviewDialog: vi.fn() })
}))

vi.mock('~/hooks/useLearnableMetrics', () => ({
	useLearnableMetrics: () => ({
		freshnessTierInfo: { label: 'Fresh', tooltip: null },
		freshnessTierColor: 'text-green-600',
		isUnreviewed: true,
		stabilityText: '1d'
	})
}))

vi.mock('~/stores/ReviewModeContext', async importOriginal => {
	const actual =
		await importOriginal<typeof import('~/stores/ReviewModeContext')>()

	return {
		...actual,
		useReviewMode: () => ({
			hidesPrimary: false,
			hidesSecondary: false
		})
	}
})

const reviewCard = {
	id: 11,
	topic_id: 1,
	topic_title: 'Algebra',
	type: 'practice' as const,
	prompt: 'Solve for x',
	answer: 'x = 3',
	notes: 'Factor carefully',
	inserted_at: '2026-03-01T12:00:00.000Z',
	updated_at: '2026-03-04T12:00:00.000Z',
	last_review_rating: null,
	stability: null,
	difficulty: null,
	state: 'new',
	step: null,
	retired: false,
	flagged_at: null,
	last_reviewed_at: null,
	retrievability: null,
	freshness_tier: null,
	days_until_next_tier: null,
	days_in_current_tier: null,
	is_new: true,
	status_badges: []
}

const reviews = [
	{
		id: 101,
		review_card: {
			id: 11,
			prompt: 'Solve for x'
		},
		description: 'Linked review item',
		notes: null,
		rating: 'good',
		scheduled_at: null,
		effective_date: null,
		completed_at: '2026-03-04',
		inserted_at: '2026-03-04T12:00:00.000Z'
	}
]

function renderRoute(route: string) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { gcTime: Number.POSITIVE_INFINITY, retry: false }
		}
	})
	const router = createRouter({
		routeTree,
		history: createMemoryHistory({ initialEntries: [route] }),
		context: {
			queryClient
		}
	})

	return {
		router,
		user: userEvent.setup(),
		...render(
			<QueryClientProvider client={queryClient}>
				<RouterProvider context={{ queryClient }} router={router} />
			</QueryClientProvider>
		)
	}
}

beforeEach(() => {
	useReviewCardMock.mockReset()
	useTopicMock.mockReset()
	useReviewsByReviewCardMock.mockReset()

	useReviewCardMock.mockReturnValue({
		data: reviewCard,
		isLoading: false,
		error: null
	})
	useTopicMock.mockReturnValue({
		data: { id: 1, title: 'Algebra' },
		isLoading: false,
		error: null
	})
	useReviewsByReviewCardMock.mockReturnValue({
		data: reviews,
		isLoading: false
	})
})

describe('review card detail route-backed tabs', () => {
	it('falls back to the home tab for invalid search', async () => {
		const { router } = renderRoute('/review-cards/11?tab=invalid')

		expect(await screen.findByRole('tab', { name: 'Home' })).toBeInTheDocument()
		expect(screen.queryByText('Linked review item')).not.toBeInTheDocument()
		await waitFor(() => {
			expect(router.state.location.search).toEqual({ tab: 'home' })
		})
	})

	it('deep links the reviews tab and updates search when tabs change', async () => {
		const { router, user } = renderRoute('/review-cards/11?tab=reviews')

		expect(await screen.findByText('Linked review item')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /create review/iu })
		).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: /^Reviews$/iu })
		).not.toBeInTheDocument()

		await user.click(screen.getByRole('tab', { name: 'Home' }))

		await waitFor(() => {
			expect(router.state.location.search).toEqual({ tab: 'home' })
		})

		await user.click(screen.getByRole('tab', { name: /Reviews/iu }))

		await waitFor(() => {
			expect(router.state.location.search).toEqual({ tab: 'reviews' })
		})
	})

	it('deep links the notes tab and updates search when tabs change', async () => {
		const { router, user } = renderRoute('/review-cards/11?tab=notes')

		expect(
			await screen.findByRole('tab', { name: 'Notes' })
		).toBeInTheDocument()

		await user.click(screen.getByRole('tab', { name: /Reviews/iu }))

		await waitFor(() => {
			expect(router.state.location.search).toEqual({ tab: 'reviews' })
		})

		await user.click(screen.getByRole('tab', { name: 'Notes' }))

		await waitFor(() => {
			expect(router.state.location.search).toEqual({ tab: 'notes' })
		})
	})
})
