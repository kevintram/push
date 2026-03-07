import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeTree } from '~/app/routeTree.gen'

const useTopicMock = vi.fn()
const useTopicsMock = vi.fn()
const useReviewCardsMock = vi.fn()
const useReviewCardQueueMock = vi.fn()

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

const PRACTICE_VIEW_PREFERENCES_STORAGE_KEY = '3gulp-practice-view-preferences'
const FLASHCARDS_VIEW_PREFERENCES_STORAGE_KEY =
	'3gulp-flashcards-view-preferences'
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
	ReviewCard: ({ reviewCard }: { reviewCard: { prompt: string } }) => (
		<div data-testid='review-card'>{reviewCard.prompt}</div>
	)
}))

vi.mock('~/features/topics/components/TopicCard', () => ({
	TopicCard: ({ topic }: { topic: { title: string } }) => (
		<div data-testid='topic-card'>{topic.title}</div>
	)
}))

vi.mock('~/features/topics/api/getTopic', () => ({
	useTopic: (...args: Array<unknown>) => useTopicMock(...args)
}))

vi.mock('~/features/topics/api/getTopics', () => ({
	useTopics: (...args: Array<unknown>) => useTopicsMock(...args)
}))

vi.mock('~/features/review-cards/api/getReviewCards', () => ({
	useReviewCards: (...args: Array<unknown>) => useReviewCardsMock(...args)
}))

vi.mock('~/features/review-cards/api/getReviewCardQueue', () => ({
	useReviewCardQueue: (...args: Array<unknown>) =>
		useReviewCardQueueMock(...args),
	useReviewCardQueuePage: (...args: Array<unknown>) =>
		normalizeQueuePageResult(useReviewCardQueueMock(...args))
}))

vi.mock('~/stores/FlashcardModeContext', () => ({
	useFlashcardMode: () => ({
		hidesPrimary: false,
		hidesSecondary: false
	})
}))

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
	pinned_at: null,
	last_reviewed_at: null,
	retrievability: null,
	freshness_tier: null,
	days_until_next_tier: null,
	days_in_current_tier: null,
	is_new: true,
	status_badges: []
}

function renderRoute(route: string) {
	const router = createRouter({
		routeTree,
		history: createMemoryHistory({ initialEntries: [route] })
	})
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { gcTime: Number.POSITIVE_INFINITY, retry: false }
		}
	})

	return {
		router,
		user: userEvent.setup(),
		...render(
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		)
	}
}

beforeEach(() => {
	useTopicMock.mockReset()
	useTopicsMock.mockReset()
	useReviewCardsMock.mockReset()
	useReviewCardQueueMock.mockReset()
	storage.clear()
	Object.defineProperty(window, 'localStorage', {
		value: mockLocalStorage,
		configurable: true
	})
})

describe('route-backed tab search state', () => {
	it('falls back to Flashcards due focused state for invalid search', async () => {
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: {
						...reviewCard,
						id: 21,
						type: 'flashcard',
						prompt: 'Due flashcard'
					},
					review_id: null,
					scheduled_at: '2026-03-05',
					days_until_due: 0
				}
			],
			isLoading: false
		})

		renderRoute('/flashcards?tab=invalid&scope=invalid')

		await waitFor(() => {
			expect(useReviewCardQueueMock).toHaveBeenLastCalledWith({
				type: 'flashcard',
				tab: 'due',
				focused: true
			})
		})
		expect(screen.queryByTestId('masonry-layout')).not.toBeInTheDocument()
		expect(screen.getByText('Due flashcard')).toBeInTheDocument()
	})

	it('restores the last Flashcards due scope when switching back from new', async () => {
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: {
						...reviewCard,
						id: 22,
						type: 'flashcard',
						prompt: 'Switch flashcard'
					},
					review_id: null,
					scheduled_at: '2026-03-05',
					days_until_due: 0
				}
			],
			isLoading: false
		})
		const { router, user } = renderRoute('/flashcards?tab=due&scope=all')
		const newTab = await screen.findByRole('tab', { name: 'New' })

		await user.click(newTab)

		await waitFor(() => {
			expect(router.state.location.search).toEqual({ tab: 'new' })
		})

		await user.click(screen.getByRole('tab', { name: 'Due' }))

		await waitFor(() => {
			expect(router.state.location.search).toEqual({
				tab: 'due',
				scope: 'all'
			})
		})
	})

	it('restores stored Flashcards preferences when search params are missing', async () => {
		window.localStorage.setItem(
			FLASHCARDS_VIEW_PREFERENCES_STORAGE_KEY,
			JSON.stringify({ tab: 'new', dueScope: 'all' })
		)
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'new',
					card: {
						...reviewCard,
						id: 23,
						type: 'flashcard',
						prompt: 'Stored flashcard view'
					},
					review_id: null,
					scheduled_at: null,
					days_until_due: null
				}
			],
			isLoading: false
		})

		renderRoute('/flashcards')

		await waitFor(() => {
			expect(useReviewCardQueueMock).toHaveBeenLastCalledWith({
				type: 'flashcard',
				tab: 'new',
				focused: undefined
			})
		})
		expect(screen.getByText('Stored flashcard view')).toBeInTheDocument()
	})

	it('falls back to Practice due focused state for invalid search', async () => {
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: { ...reviewCard, id: 31, prompt: 'Due practice' },
					review_id: null,
					scheduled_at: '2026-03-05',
					days_until_due: 0
				}
			],
			isLoading: false
		})

		renderRoute('/practice?tab=invalid&scope=invalid')

		await waitFor(() => {
			expect(useReviewCardQueueMock).toHaveBeenLastCalledWith({
				type: 'practice',
				tab: 'due',
				focused: true
			})
		})
		expect(screen.queryByTestId('masonry-layout')).not.toBeInTheDocument()
		expect(screen.getByText('Due practice')).toBeInTheDocument()
	})

	it('restores the last Practice due scope when switching back from new', async () => {
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: { ...reviewCard, id: 32, prompt: 'Switch practice' },
					review_id: null,
					scheduled_at: '2026-03-05',
					days_until_due: 0
				}
			],
			isLoading: false
		})
		const { router, user } = renderRoute('/practice?tab=due&scope=all')
		const newTab = await screen.findByRole('tab', { name: 'New' })

		await user.click(newTab)

		await waitFor(() => {
			expect(router.state.location.search).toEqual({ tab: 'new' })
		})

		await user.click(screen.getByRole('tab', { name: 'Due' }))

		await waitFor(() => {
			expect(router.state.location.search).toEqual({
				tab: 'due',
				scope: 'all'
			})
		})
	})

	it('restores stored Practice preferences when search params are missing', async () => {
		window.localStorage.setItem(
			PRACTICE_VIEW_PREFERENCES_STORAGE_KEY,
			JSON.stringify({ tab: 'new', dueScope: 'all' })
		)
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'new',
					card: { ...reviewCard, id: 33, prompt: 'Stored practice view' },
					review_id: null,
					scheduled_at: null,
					days_until_due: null
				}
			],
			isLoading: false
		})

		renderRoute('/practice')

		await waitFor(() => {
			expect(useReviewCardQueueMock).toHaveBeenLastCalledWith({
				type: 'practice',
				tab: 'new',
				focused: undefined
			})
		})
		expect(screen.getByText('Stored practice view')).toBeInTheDocument()
	})

	it('falls back to TopicDetail subtopics and all-card filter for invalid search', async () => {
		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: topic, isLoading: false, error: null }
			}
			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockReturnValue({
			data: [{ ...topic, id: 2, title: 'Subtopic' }],
			isLoading: false
		})
		useReviewCardsMock.mockReturnValue({
			data: [{ ...reviewCard, id: 33, prompt: 'Topic card' }],
			isLoading: false
		})

		renderRoute('/topics/1?tab=invalid&filter=invalid')

		await waitFor(() => {
			expect(useReviewCardsMock).toHaveBeenLastCalledWith(
				{
					topic_id: 1,
					type: undefined,
					order: 'desc'
				},
				{ enabled: true }
			)
		})
		expect(screen.getByTestId('topic-card')).toHaveTextContent('Subtopic')
	})

	it('deep links TopicDetail review-card filters and removes filter on subtopics', async () => {
		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return { data: topic, isLoading: false, error: null }
			}
			return { data: null, isLoading: false, error: null }
		})
		useTopicsMock.mockReturnValue({
			data: [{ ...topic, id: 2, title: 'Subtopic' }],
			isLoading: false
		})
		useReviewCardsMock.mockReturnValue({
			data: [{ ...reviewCard, id: 34, prompt: 'Practice-only card' }],
			isLoading: false
		})
		const { router, user } = renderRoute(
			'/topics/1?tab=review_cards&filter=practice'
		)

		await waitFor(() => {
			expect(useReviewCardsMock).toHaveBeenLastCalledWith(
				{
					topic_id: 1,
					type: 'practice',
					order: 'desc'
				},
				{ enabled: true }
			)
		})
		expect(await screen.findByText('Practice-only card')).toBeInTheDocument()

		await user.click(await screen.findByRole('tab', { name: /Subtopics/i }))

		await waitFor(() => {
			expect(router.state.location.search).toEqual({ tab: 'subtopics' })
		})
	})
})
