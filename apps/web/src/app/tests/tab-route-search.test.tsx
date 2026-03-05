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
		useReviewCardQueueMock(...args)
}))

vi.mock('~/stores/FlashcardModeContext', () => ({
	useFlashcardMode: () => ({
		hidesPrimary: false,
		hidesSecondary: false
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
	inserted_at: '2026-03-01T12:00:00.000Z',
	updated_at: '2026-03-04T12:00:00.000Z',
	last_review_rating: null,
	stability: null,
	difficulty: null,
	state: 'new',
	step: null,
	retired: false,
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

	it('removes Flashcards scope on new and restores due default when switching back', async () => {
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
				scope: 'focused'
			})
		})
	})

	it('falls back to Practice due all state for invalid search', async () => {
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
				focused: false
			})
		})
		expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
		expect(screen.getByText('Due practice')).toBeInTheDocument()
	})

	it('removes Practice scope on new and restores due default when switching back', async () => {
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
		const { router, user } = renderRoute('/practice?tab=due&scope=focused')
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
		expect(screen.getByText('Subtopic')).toBeInTheDocument()
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
