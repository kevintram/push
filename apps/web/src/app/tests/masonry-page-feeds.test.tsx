import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FlashcardsPage } from '~/app/pages/FlashcardsPage'
import { MyLibraryPage } from '~/app/pages/MyLibraryPage'
import { PracticePage } from '~/app/pages/PracticePage'
import { RecentPage } from '~/app/pages/RecentPage'
import { TopicDetailPage } from '~/app/pages/TopicDetailPage'

const navigateMock = vi.fn()
const masonryRenderSpy = vi.fn()
const masonryPropsSpy = vi.fn()
const useTopicsMock = vi.fn()
const useTopicMock = vi.fn()
const useReviewCardsMock = vi.fn()
const useReviewCardQueueMock = vi.fn()
const useSearchAllMock = vi.fn()
const createTopicAsyncMock = vi.fn()

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		useNavigate: () => navigateMock
	}
})

vi.mock('~/components/masonry-layout/MasonryLayout', () => ({
	MasonryLayout: ({
		items,
		renderItem,
		getItemKey,
		getScrollElement
	}: {
		items: Array<unknown>
		renderItem: (item: any, index: number, laneWidth: number) => ReactNode
		getItemKey?: (item: any, index: number) => string | number
		getScrollElement?: () => HTMLDivElement | null
	}) => {
		masonryRenderSpy(items)
		masonryPropsSpy({ items, getScrollElement })
		return (
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
	}
}))

vi.mock('~/features/topics/components/TopicCard', () => ({
	TopicCard: ({ topic }: { topic: { title: string } }) => (
		<div data-testid='topic-card'>{topic.title}</div>
	)
}))

vi.mock('~/features/review-cards/components/ReviewCard', () => ({
	ReviewCard: ({ reviewCard }: { reviewCard: { prompt: string } }) => (
		<div data-testid='review-card'>{reviewCard.prompt}</div>
	)
}))

vi.mock('~/features/topics/api/getTopics', () => ({
	useTopics: (...args: Array<unknown>) => useTopicsMock(...args)
}))

vi.mock('~/features/topics/api/getTopic', () => ({
	useTopic: (...args: Array<unknown>) => useTopicMock(...args)
}))

vi.mock('~/features/review-cards/api/getReviewCards', () => ({
	useReviewCards: (...args: Array<unknown>) => useReviewCardsMock(...args)
}))

vi.mock('~/features/review-cards/api/getReviewCardQueue', () => ({
	useReviewCardQueue: (...args: Array<unknown>) => useReviewCardQueueMock(...args)
}))

vi.mock('~/features/search/api/searchAll', () => ({
	useSearchAll: (...args: Array<unknown>) => useSearchAllMock(...args)
}))

vi.mock('~/features/topics/api/createTopic', () => ({
	useCreateTopic: () => ({
		mutateAsync: createTopicAsyncMock,
		isPending: false
	})
}))

vi.mock('~/features/topics/api/deleteTopic', () => ({
	useDeleteTopic: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/topics/api/updateTopic', () => ({
	useUpdateTopic: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/review-cards/api/createReviewCard', () => ({
	useCreateReviewCard: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/reviews/api/createReview', () => ({
	useCreateReview: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/stores/FlashcardModeContext', () => ({
	useFlashcardMode: () => ({
		hidesPrimary: false,
		hidesSecondary: false
	})
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
	fsrs_state_id: null,
	stability: null,
	difficulty: null,
	state: 'new',
	step: null,
	srs_enabled: true,
	last_reviewed_at: null,
	retrievability: null,
	freshness_tier: null,
	days_until_next_tier: null,
	days_in_current_tier: null,
	is_new: true,
	status_badges: []
}

beforeEach(() => {
	navigateMock.mockReset()
	masonryRenderSpy.mockReset()
	masonryPropsSpy.mockReset()
	useTopicsMock.mockReset()
	useTopicMock.mockReset()
	useReviewCardsMock.mockReset()
	useReviewCardQueueMock.mockReset()
	useSearchAllMock.mockReset()
	createTopicAsyncMock.mockReset()
	window.sessionStorage.clear()
})

describe('masonry-backed page feeds', () => {
	it('renders MyLibrary topics through masonry', () => {
		useTopicsMock.mockReturnValue({
			data: [topic],
			isLoading: false
		})

		render(<MyLibraryPage />)

		expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
		expect(screen.getByTestId('topic-card')).toHaveTextContent('Algebra')
		expect(masonryRenderSpy).toHaveBeenCalledWith([topic])
	})

	it('creates a blank root topic and navigates to it from the topics page', async () => {
		const user = userEvent.setup()
		useTopicsMock.mockReturnValue({
			data: [],
			isLoading: false
		})
		createTopicAsyncMock.mockResolvedValue({
			id: 42
		})

		render(<MyLibraryPage />)

		await user.click(screen.getAllByRole('button', { name: /^Create$/i })[0])

		expect(createTopicAsyncMock).toHaveBeenCalledWith({
			title: '',
			body: '',
			parent_id: null
		})
		expect(navigateMock).toHaveBeenCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '42' }
		})
	})

	it('renders Recent grouped sections through masonry', () => {
		useSearchAllMock.mockReturnValue({
			data: [
				{
					entity_type: 'topic',
					topic,
					review_card: null,
					recent_activity_at: '2026-03-05T09:00:00.000Z'
				},
				{
					entity_type: 'review_card',
					topic: null,
					review_card: {
						...reviewCard,
						id: 12,
						prompt: 'Different prompt'
					},
					recent_activity_at: '2026-03-05T08:00:00.000Z'
				}
			],
			isLoading: false
		})

		render(<RecentPage />)

		expect(screen.getByText('Today')).toBeInTheDocument()
		expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
		expect(screen.getAllByTestId('masonry-item')).toHaveLength(2)
		expect(screen.getByTestId('topic-card')).toHaveTextContent('Algebra')
		expect(screen.getByText('Different prompt')).toBeInTheDocument()
	})

	it('renders TopicDetail subtopics and review cards through masonry in tabs', async () => {
		const user = userEvent.setup()
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
			data: [{ ...reviewCard, id: 13, prompt: 'Topic detail card' }],
			isLoading: false
		})

		render(<TopicDetailPage topicId={1} />)

		expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
		expect(screen.getByText('Subtopic')).toBeInTheDocument()

		await user.click(screen.getByRole('tab', { name: /Review Cards/i }))

		expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
		expect(screen.getByText('Topic detail card')).toBeInTheDocument()
		expect(
			masonryPropsSpy.mock.calls.some(
				([props]) =>
					props.items.length > 0 && typeof props.getScrollElement === 'function'
			)
		).toBe(true)
	})

	it('renders Flashcards list views through masonry but keeps focused view non-masonry', async () => {
		const user = userEvent.setup()
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: { ...reviewCard, id: 21, prompt: 'Flashcard prompt' },
					review_id: null,
					scheduled_at: '2026-03-05',
					days_until_due: 0
				}
			],
			isLoading: false
		})

		render(<FlashcardsPage />)

		expect(screen.queryByTestId('masonry-layout')).not.toBeInTheDocument()
		expect(screen.getByText('Flashcard prompt')).toBeInTheDocument()

		await user.click(screen.getByRole('tab', { name: 'All' }))

		expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
		expect(screen.getByText('Thursday, Mar 5')).toBeInTheDocument()
	})

	it('renders Practice list views through masonry and keeps focused view non-masonry', async () => {
		const user = userEvent.setup()
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: { ...reviewCard, id: 31, prompt: 'Practice prompt' },
					review_id: null,
					scheduled_at: '2026-03-05',
					days_until_due: 0
				}
			],
			isLoading: false
		})

		render(<PracticePage />)

		expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
		expect(screen.getByText('Thursday, Mar 5')).toBeInTheDocument()

		await user.click(screen.getByRole('tab', { name: 'Focused' }))

		expect(screen.queryByTestId('masonry-layout')).not.toBeInTheDocument()
		expect(screen.getByText('Practice prompt')).toBeInTheDocument()
	})
})
