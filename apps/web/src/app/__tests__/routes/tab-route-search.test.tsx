import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeTree } from '~/app/routeTree.gen'
import { server } from '~/testing/msw/server'

const useTopicMock = vi.fn()
const useTopicsMock = vi.fn()
const useReviewCardsMock = vi.fn()
const useReviewCardQueueMock = vi.fn()
const useReviewCardQueueCountsMock = vi.fn()

function normalizeQueuePageResult(result: {
	data?: unknown
	isLoading?: boolean
}) {
	if (Array.isArray(result.data)) {
		return {
			...result,
			data: {
				items: result.data,
				as_of: '2026-03-05'
			}
		}
	}

	return result
}

const storage = new Map<string, string>()

const mockLocalStorage = {
	getItem: (key: string) => storage.get(key) ?? null,
	setItem: (key: string, value: string) => {
		storage.set(key, value)
	},
	removeItem: (key: string) => {
		storage.delete(key)
	},
	clear: () => {
		storage.clear()
	}
}

vi.mock('~/components/masonry-layout/MasonryLayout', () => ({
	MasonryLayout: ({
		items,
		renderItem,
		getItemKey
	}: {
		items: Array<unknown>
		renderItem: (item: any, index: number, laneWidth: number) => ReactNode
		getItemKey?: (item: any, index: number) => string | number
	}) => (
		<div data-testid='masonry-layout'>
			{items.map((item, index) => (
				<div
					data-testid='masonry-item'
					key={getItemKey?.(item, index) ?? index}
				>
					{renderItem(item, index, 320)}
				</div>
			))}
		</div>
	)
}))

vi.mock('~/components/SettingsDialog', () => ({
	SettingsDialog: () => null
}))

vi.mock('~/features/review-cards/components/ReviewCard', () => ({
	ReviewCard: ({ reviewCard }: { reviewCard: { primary_text: string } }) => (
		<div data-testid='review-card'>{reviewCard.primary_text}</div>
	)
}))

vi.mock('~/app/pages/review-card-detail/ReviewCardDetailPage', () => ({
	ReviewCardDetailPage: ({ reviewCardId }: { reviewCardId: number }) => (
		<div data-testid='review-card-detail-page'>{reviewCardId}</div>
	)
}))

vi.mock('~/features/topics/components/TopicCard', () => ({
	TopicCard: ({ topic }: { topic: { title: string } }) => (
		<div data-testid='topic-card'>{topic.title}</div>
	)
}))

vi.mock('~/features/topics/api/getTopic', () => ({
	topicQueryOptions: (topicId: number) => ({
		queryKey: ['topics', 'detail', topicId],
		queryFn: async () => ({
			id: topicId,
			title: 'Prefetched topic',
			body: '',
			parent_id: null,
			inserted_at: '2026-03-01T12:00:00.000Z',
			updated_at: '2026-03-04T12:00:00.000Z'
		})
	}),
	useTopic: (...args: Array<unknown>) => useTopicMock(...args)
}))

vi.mock('~/features/topics/api/getTopics', () => ({
	topicsQueryOptions: () => ({
		queryKey: ['topics', 'list', { sort: 'title', order: 'asc' }],
		queryFn: async () => []
	}),
	useTopics: (...args: Array<unknown>) => useTopicsMock(...args)
}))

vi.mock('~/features/review-cards/api/getReviewCards', () => ({
	reviewCardsQueryOptions: (params: Record<string, unknown>) => ({
		queryKey: ['review-cards', 'list', params],
		queryFn: async () => []
	}),
	useReviewCards: (...args: Array<unknown>) => useReviewCardsMock(...args)
}))

vi.mock('~/features/review-cards/api/getReviewCardQueue', () => ({
	useReviewCardQueue: (...args: Array<unknown>) =>
		useReviewCardQueueMock(...args),
	useReviewCardQueuePage: (...args: Array<unknown>) =>
		normalizeQueuePageResult(useReviewCardQueueMock(...args))
}))

vi.mock('~/features/review-cards/hooks/useReviewCardQueueCounts', () => ({
	useReviewCardQueueCounts: (...args: Array<unknown>) =>
		useReviewCardQueueCountsMock(...args)
}))

vi.mock('~/stores/ReviewModeContext', async importOriginal => {
	const actual =
		await importOriginal<typeof import('~/stores/ReviewModeContext')>()

	return {
		...actual,
		useReviewMode: () => ({
			reviewMode: 'off',
			setReviewMode: () => {},
			isReviewModeEnabled: false,
			hidesPrimary: false,
			hidesSecondary: false
		})
	}
})

vi.mock('~/stores/WeekStartContext', () => ({
	useWeekStart: () => ({
		weekStartDay: 1,
		setWeekStartDay: vi.fn()
	})
}))

vi.mock('~/stores/ThemeContext', () => ({
	ThemeProvider: ({ children }: { children: ReactNode }) => children,
	useTheme: () => ({
		theme: 'system',
		resolvedTheme: 'light',
		setTheme: vi.fn()
	})
}))

vi.mock('~/features/review-cards/api/createReviewCard', () => ({
	useCreateReviewCard: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/topics/api/createTopic', () => ({
	useCreateTopic: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/topics/api/updateTopic', () => ({
	useUpdateTopic: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/topics/api/deleteTopic', () => ({
	useDeleteTopic: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/reviews/api/createReview', () => ({
	useCreateReview: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

const topic = {
	id: 1,
	title: 'Algebra',
	body: 'Working with expressions',
	parent_id: null,
	parent_title: null,
	inserted_at: '2026-03-01T12:00:00.000Z',
	updated_at: '2026-03-04T12:00:00.000Z'
}

const reviewCard = {
	id: 11,
	topic_id: 1,
	topic_title: 'Algebra',
	type: 'practice' as const,
	primary_text: 'Solve for x',
	secondary_text: 'x = 3',
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
	useTopicMock.mockReset()
	useTopicsMock.mockReset()
	useReviewCardsMock.mockReset()
	useReviewCardQueueMock.mockReset()
	useReviewCardQueueCountsMock.mockReset()
	useTopicsMock.mockReturnValue({ data: [], isLoading: false, error: null })
	useReviewCardQueueMock.mockReturnValue({
		data: { items: [], as_of: '2026-03-05' },
		isLoading: false
	})
	useReviewCardQueueCountsMock.mockReturnValue({
		overdueCount: 0,
		dueTodayCount: 0,
		newCount: 0,
		dueNextSevenDaysCount: 0
	})
	server.use(
		http.get('*/review-cards/:reviewCardId/', () =>
			HttpResponse.json(reviewCard)
		)
	)
	storage.clear()
	Object.defineProperty(window, 'localStorage', {
		value: mockLocalStorage,
		configurable: true
	})
})

describe('route-backed tab search state', () => {
	it('redirects legacy flashcards list route to Reviews filtered to flashcards', async () => {
		const { router } = renderRoute('/flashcards?tab=invalid&scope=invalid')

		await waitFor(() => {
			expect(router.state.location.pathname).toBe('/review')
			expect(router.state.location.search).toEqual({ filter: 'flashcards' })
		})
	})

	it('redirects legacy practice list route to Reviews filtered to practice', async () => {
		const { router } = renderRoute('/practice?tab=invalid&scope=invalid')

		await waitFor(() => {
			expect(router.state.location.pathname).toBe('/review')
			expect(router.state.location.search).toEqual({ filter: 'practice' })
		})
	})

	it('redirects legacy review-card routes to the canonical detail page', async () => {
		const { router } = renderRoute('/flashcards/42')

		await waitFor(() => {
			expect(router.state.location.pathname).toBe('/review-cards/42')
		})
	})

	it('redirects legacy practice-card routes to the canonical detail page', async () => {
		const { router } = renderRoute('/practice/43')

		await waitFor(() => {
			expect(router.state.location.pathname).toBe('/review-cards/43')
		})
	})

	it('falls back to TopicDetail all-card filter for invalid search', async () => {
		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: topic, isLoading: false, error: null }
			}
			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockReturnValue({ data: [], isLoading: false })
		useReviewCardsMock.mockReturnValue({
			data: [{ ...reviewCard, id: 33, primary_text: 'Topic card' }],
			isLoading: false
		})

		renderRoute('/topics/1?tab=invalid&filter=invalid')

		await waitFor(() => {
			expect(useReviewCardsMock).toHaveBeenLastCalledWith({
				topic_id: 1,
				include_descendants: true,
				order: 'desc'
			})
		})
		expect(screen.getByText('Topic card')).toBeInTheDocument()
	})

	it('deep links TopicDetail review-card filters and clears filter when all is selected', async () => {
		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: topic, isLoading: false, error: null }
			}
			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockReturnValue({ data: [], isLoading: false })
		useReviewCardsMock.mockReturnValue({
			data: [{ ...reviewCard, id: 34, primary_text: 'Practice-only card' }],
			isLoading: false
		})
		const { router, user } = renderRoute('/topics/1?filter=practice')

		await waitFor(() => {
			expect(useReviewCardsMock).toHaveBeenLastCalledWith({
				topic_id: 1,
				include_descendants: true,
				order: 'desc'
			})
		})
		expect(await screen.findByText('Practice-only card')).toBeInTheDocument()

		const [globalAllFilter] = screen.getAllByText('All')
		expect(globalAllFilter).toBeDefined()

		await user.click(globalAllFilter!)

		await waitFor(() => {
			expect(router.state.location.search).toEqual({})
		})
	})
})
