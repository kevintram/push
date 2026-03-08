import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	FlashcardsPage,
	type FlashcardsScope,
	type FlashcardsTab
} from '~/app/pages/FlashcardsPage'
import {
	PracticePage,
	type PracticeScope,
	type PracticeTab
} from '~/app/pages/PracticePage'
import { RecentPage } from '~/app/pages/RecentPage'
import {
	TopicDetailPage,
	type TopicDetailReviewCardFilter,
	type TopicDetailTab
} from '~/app/pages/TopicDetailPage'
import { TopicsPage } from '~/app/pages/TopicsPage'

const navigateMock = vi.fn()
const masonryRenderSpy = vi.fn()
const masonryPropsSpy = vi.fn()
const reviewCardRenderSpy = vi.fn()
const useTopicsMock = vi.fn()
const useTopicMock = vi.fn()
const useReviewCardsMock = vi.fn()
const useReviewCardQueueMock = vi.fn()
const useReviewCardQueueCountsMock = vi.fn()
const useSearchAllMock = vi.fn()
const createTopicAsyncMock = vi.fn()
const updateReviewCardAsyncMock = vi.fn()

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
	ReviewCard: (props: {
		reviewCard: { prompt: string }
		enableLargeCardMode?: boolean
	}) => {
		reviewCardRenderSpy(props)
		return <div data-testid='review-card'>{props.reviewCard.prompt}</div>
	}
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
	useReviewCardQueue: (...args: Array<unknown>) =>
		useReviewCardQueueMock(...args),
	useReviewCardQueuePage: (...args: Array<unknown>) =>
		normalizeQueuePageResult(useReviewCardQueueMock(...args))
}))

vi.mock('~/features/review-cards/hooks/useReviewCardQueueCounts', () => ({
	useReviewCardQueueCounts: (...args: Array<unknown>) =>
		useReviewCardQueueCountsMock(...args)
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

vi.mock('~/features/review-cards/api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({
		mutateAsync: updateReviewCardAsyncMock,
		isPending: false
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

vi.mock('~/stores/WeekStartContext', () => ({
	useWeekStart: () => ({
		weekStartDay: 1,
		setWeekStartDay: vi.fn()
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

function buildPracticeQueueItems(count: number) {
	return Array.from({ length: count }, (_, index) => ({
		queue_type: 'due' as const,
		card: {
			...reviewCard,
			id: 31 + index,
			prompt: `Practice prompt ${index + 1}`
		},
		review_id: null,
		scheduled_at: '2026-03-05',
		days_until_due: 0,
		days_until_hazy: null
	}))
}

function FlashcardsHarness({
	initialTab = 'due',
	initialScope = 'focused'
}: {
	initialTab?: FlashcardsTab
	initialScope?: FlashcardsScope
}) {
	const [activeTab, setActiveTab] = useState<FlashcardsTab>(initialTab)
	const [scope, setScope] = useState<FlashcardsScope>(initialScope)

	return (
		<FlashcardsPage
			activeTab={activeTab}
			onActiveTabChange={setActiveTab}
			onScopeChange={setScope}
			scope={scope}
		/>
	)
}

function PracticeHarness({
	initialTab = 'due',
	initialScope = 'all'
}: {
	initialTab?: PracticeTab
	initialScope?: PracticeScope
}) {
	const [activeTab, setActiveTab] = useState<PracticeTab>(initialTab)
	const [scope, setScope] = useState<PracticeScope>(initialScope)

	return (
		<PracticePage
			activeTab={activeTab}
			onActiveTabChange={setActiveTab}
			onScopeChange={setScope}
			scope={scope}
		/>
	)
}

function TopicDetailHarness({
	initialTab = 'subtopics',
	initialFilter = 'all'
}: {
	initialTab?: TopicDetailTab
	initialFilter?: TopicDetailReviewCardFilter
}) {
	const [activeHomeTab, setActiveHomeTab] = useState<TopicDetailTab>(initialTab)
	const [cardTypeFilter, setCardTypeFilter] =
		useState<TopicDetailReviewCardFilter>(initialFilter)

	return (
		<TopicDetailPage
			activeHomeTab={activeHomeTab}
			cardTypeFilter={cardTypeFilter}
			onActiveHomeTabChange={setActiveHomeTab}
			onCardTypeFilterChange={setCardTypeFilter}
			topicId={1}
		/>
	)
}

beforeEach(() => {
	navigateMock.mockReset()
	masonryRenderSpy.mockReset()
	masonryPropsSpy.mockReset()
	reviewCardRenderSpy.mockReset()
	useTopicsMock.mockReset()
	useTopicMock.mockReset()
	useReviewCardsMock.mockReset()
	useReviewCardQueueMock.mockReset()
	useReviewCardQueueCountsMock.mockReset()
	useSearchAllMock.mockReset()
	createTopicAsyncMock.mockReset()
	updateReviewCardAsyncMock.mockReset()
	useReviewCardQueueCountsMock.mockReturnValue({
		overdueCount: 0,
		dueTodayCount: 0,
		newCount: 0,
		dueNextSevenDaysCount: 0
	})
	window.sessionStorage.clear()
	window.happyDOM?.setViewport({ height: 900, width: 1024 })
})

describe('masonry-backed page feeds', () => {
	it('renders MyLibrary topics through masonry', () => {
		useTopicsMock.mockReturnValue({
			data: [topic],
			isLoading: false
		})

		render(<TopicsPage />)

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

		render(<TopicsPage />)

		const [createButton] = screen.getAllByRole('button', { name: /^Create$/i })

		expect(createButton).toBeDefined()
		if (!createButton) {
			throw new Error('Expected a create button to be rendered')
		}

		await user.click(createButton)

		expect(createTopicAsyncMock).toHaveBeenCalledWith({
			title: '',
			body: '',
			parent_id: null
		})
		expect(navigateMock).toHaveBeenCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '42' },
			search: { tab: 'subtopics' }
		})
	})

	it('renders Recent grouped sections through masonry', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-03-05T12:00:00.000Z'))
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

		try {
			render(<RecentPage />)

			expect(screen.getByText('Today')).toBeInTheDocument()
			expect(screen.getByTestId('masonry-layout')).toBeInTheDocument()
			expect(screen.getAllByTestId('masonry-item')).toHaveLength(2)
			expect(screen.getByTestId('topic-card')).toHaveTextContent('Algebra')
			expect(screen.getByText('Different prompt')).toBeInTheDocument()
		} finally {
			vi.useRealTimers()
		}
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

		render(<TopicDetailHarness />)

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
					card: { ...reviewCard, id: 21, prompt: 'Today flashcard prompt' },
					review_id: null,
					scheduled_at: '2026-03-05',
					days_until_due: 0,
					days_until_hazy: null
				},
				{
					queue_type: 'due',
					card: {
						...reviewCard,
						id: 22,
						prompt: 'Tomorrow flashcard prompt'
					},
					review_id: null,
					scheduled_at: '2026-03-06',
					days_until_due: 1,
					days_until_hazy: null
				}
			],
			isLoading: false
		})

		render(<FlashcardsHarness />)

		expect(screen.queryByTestId('masonry-layout')).not.toBeInTheDocument()
		expect(screen.getByText('Today flashcard prompt')).toBeInTheDocument()
		expect(reviewCardRenderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				enableLargeCardMode: true,
				reviewCard: expect.objectContaining({
					prompt: 'Today flashcard prompt'
				})
			})
		)

		await user.click(screen.getByRole('tab', { name: 'All' }))

		expect(screen.getAllByTestId('masonry-layout')).toHaveLength(2)
		expect(screen.getByText('Today')).toBeInTheDocument()
		expect(screen.getByText('Tomorrow')).toBeInTheDocument()
	})

	it('anchors actionable week sections to the queue as_of date', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-03-09T12:00:00.000Z'))

		try {
			useReviewCardQueueMock.mockReturnValue({
				data: {
					items: [
						{
							queue_type: 'due' as const,
							card: {
								...reviewCard,
								id: 22,
								type: 'flashcard',
								prompt: 'Anchor flashcard'
							},
							review_id: null,
							scheduled_at: '2026-03-09',
							days_until_due: 2,
							days_until_hazy: null
						}
					],
					as_of: '2026-03-08'
				},
				isLoading: false
			})

			render(<FlashcardsHarness initialScope='all' />)

			expect(screen.getByText('Next week')).toBeInTheDocument()
			expect(screen.getByText('Starts Tomorrow')).toBeInTheDocument()
			expect(screen.queryByText('Tuesday')).not.toBeInTheDocument()
		} finally {
			vi.useRealTimers()
		}
	})

	it('retires the focused flashcard from the rating action row', async () => {
		const user = userEvent.setup()
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: {
						...reviewCard,
						id: 22,
						type: 'flashcard',
						prompt: 'Retire me'
					},
					review_id: null,
					scheduled_at: '2026-03-05',
					days_until_due: 0
				}
			],
			isLoading: false
		})
		updateReviewCardAsyncMock.mockResolvedValue(undefined)

		render(<FlashcardsHarness />)

		await user.click(screen.getByRole('button', { name: /retire this item/i }))

		expect(updateReviewCardAsyncMock).toHaveBeenCalledWith({
			id: 22,
			retired: true
		})
	})

	it('warns before retiring a focused flashcard with scheduled reviews', async () => {
		const user = userEvent.setup()
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: {
						...reviewCard,
						id: 23,
						type: 'flashcard',
						prompt: 'Due flashcard',
						status_badges: [
							{
								key: 'due',
								label: 'Due in 0d',
								tooltip: 'Mar 5, 2026',
								tone: 'info',
								review_id: 91
							}
						]
					},
					review_id: 91,
					scheduled_at: '2026-03-05',
					days_until_due: 0,
					days_until_hazy: null
				}
			],
			isLoading: false
		})
		updateReviewCardAsyncMock.mockResolvedValue(undefined)

		render(<FlashcardsHarness />)

		await user.click(screen.getByRole('button', { name: /retire this item/i }))

		expect(
			screen.getByRole('alertdialog', {
				name: /this card still has scheduled reviews!/i
			})
		).toBeInTheDocument()
		expect(updateReviewCardAsyncMock).not.toHaveBeenCalled()

		await user.click(screen.getByRole('button', { name: /^Confirm$/i }))

		expect(updateReviewCardAsyncMock).toHaveBeenCalledWith({
			id: 23,
			retired: true
		})
	})

	it('opens the reviews tab from the focused flashcard retire warning', async () => {
		const user = userEvent.setup()
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: {
						...reviewCard,
						id: 24,
						type: 'flashcard',
						prompt: 'Review me first',
						status_badges: [
							{
								key: 'due',
								label: 'Due in 0d',
								tooltip: 'Mar 5, 2026',
								tone: 'info',
								review_id: 92
							}
						]
					},
					review_id: 92,
					scheduled_at: '2026-03-05',
					days_until_due: 0,
					days_until_hazy: null
				}
			],
			isLoading: false
		})

		render(<FlashcardsHarness />)

		await user.click(screen.getByRole('button', { name: /retire this item/i }))
		await user.click(screen.getByRole('button', { name: /^See reviews\.$/i }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: '24' },
			search: { tab: 'reviews' }
		})
		expect(updateReviewCardAsyncMock).not.toHaveBeenCalled()
	})

	it('shows the focused flashcard retire button in an on state when retired', () => {
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: {
						...reviewCard,
						id: 25,
						type: 'flashcard',
						prompt: 'Retired flashcard',
						retired: true
					},
					review_id: null,
					scheduled_at: '2026-03-05',
					days_until_due: 0,
					days_until_hazy: null
				}
			],
			isLoading: false
		})

		render(<FlashcardsHarness />)

		const retireButton = screen.getByRole('button', {
			name: /return this item to review queue/i
		})

		expect(retireButton).toHaveAttribute('aria-pressed', 'true')
		expect(retireButton).toHaveTextContent('Retire')
		expect(retireButton).not.toHaveTextContent('Restore')
		expect(retireButton.className).toContain('bg-muted')
	})

	it('renders Practice list views through masonry and keeps focused view non-masonry', async () => {
		const user = userEvent.setup()
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: { ...reviewCard, id: 31, prompt: 'Today practice prompt' },
					review_id: null,
					scheduled_at: '2026-03-05',
					days_until_due: 0,
					days_until_hazy: null
				},
				{
					queue_type: 'due',
					card: { ...reviewCard, id: 32, prompt: 'Tomorrow practice prompt' },
					review_id: null,
					scheduled_at: '2026-03-06',
					days_until_due: 1,
					days_until_hazy: null
				}
			],
			isLoading: false
		})

		render(<PracticeHarness />)

		expect(screen.getAllByTestId('masonry-layout')).toHaveLength(2)
		expect(screen.getByText('Today')).toBeInTheDocument()
		expect(screen.getByText('Tomorrow')).toBeInTheDocument()

		await user.click(screen.getByRole('tab', { name: 'Focused' }))

		expect(screen.queryByTestId('masonry-layout')).not.toBeInTheDocument()
		expect(screen.getByText('Today practice prompt')).toBeInTheDocument()
		expect(
			reviewCardRenderSpy.mock.calls.some(([props]) => {
				if (props.reviewCard.prompt !== 'Today practice prompt') return false
				return !('enableLargeCardMode' in props && props.enableLargeCardMode)
			})
		).toBe(true)
		expect(screen.getByTestId('focused-practice-layout')).toBeInTheDocument()
		expect(screen.queryByText('Focused Queue')).not.toBeInTheDocument()
		expect(screen.queryByText('Keep this set warm')).not.toBeInTheDocument()
		expect(screen.queryByText('card in focus')).not.toBeInTheDocument()
		expect(screen.queryByText('cards in focus')).not.toBeInTheDocument()
	})

	it('renders Practice tab counts and due header summary', () => {
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 2,
			dueTodayCount: 3,
			newCount: 4,
			dueNextSevenDaysCount: 10
		})

		useReviewCardQueueMock.mockImplementation(
			(params: { type: string; tab?: string; focused?: boolean }) => {
				if (params.type !== 'practice') {
					return { data: [], isLoading: false }
				}

				if (params.tab === 'new') {
					return {
						data: Array.from({ length: 4 }, (_, index) => ({
							queue_type: 'new' as const,
							card: {
								...reviewCard,
								id: 70 + index,
								prompt: `New practice ${index + 1}`
							},
							review_id: null,
							scheduled_at: null,
							days_until_due: null,
							days_until_hazy: null
						})),
						isLoading: false
					}
				}

				return {
					data: [
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 81, prompt: 'Overdue practice A' },
							review_id: null,
							scheduled_at: '2026-03-03',
							days_until_due: -2,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 82, prompt: 'Overdue practice B' },
							review_id: null,
							scheduled_at: '2026-03-04',
							days_until_due: -1,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 83, prompt: 'Today practice A' },
							review_id: null,
							scheduled_at: '2026-03-05',
							days_until_due: 0,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 84, prompt: 'Today practice B' },
							review_id: null,
							scheduled_at: '2026-03-05',
							days_until_due: 0,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 85, prompt: 'Today practice C' },
							review_id: null,
							scheduled_at: '2026-03-05',
							days_until_due: 0,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 86, prompt: 'Soon practice A' },
							review_id: null,
							scheduled_at: '2026-03-06',
							days_until_due: 1,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 87, prompt: 'Soon practice B' },
							review_id: null,
							scheduled_at: '2026-03-07',
							days_until_due: 2,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 88, prompt: 'Soon practice C' },
							review_id: null,
							scheduled_at: '2026-03-08',
							days_until_due: 3,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 89, prompt: 'Soon practice D' },
							review_id: null,
							scheduled_at: '2026-03-09',
							days_until_due: 4,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 90, prompt: 'Soon practice E' },
							review_id: null,
							scheduled_at: '2026-03-10',
							days_until_due: 5,
							days_until_hazy: null
						}
					],
					isLoading: false
				}
			}
		)

		render(<PracticeHarness initialScope='all' />)

		const dueTab = screen.getByRole('tab', { name: 'Due' })
		const newTab = screen.getByRole('tab', { name: 'New' })
		const dueSummary = screen.getByText('Due in next 7d').parentElement

		expect(within(dueTab).getByText('2')).toBeInTheDocument()
		expect(within(dueTab).getByText('3')).toBeInTheDocument()
		expect(within(newTab).getByText('4')).toBeInTheDocument()
		expect(dueSummary).not.toBeNull()
		expect(
			within(dueSummary as HTMLElement).getByText('10')
		).toBeInTheDocument()
	})

	it('renders Flashcards counts from the full due queue while focused mode shows one card', () => {
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 1,
			dueTodayCount: 2,
			newCount: 4,
			dueNextSevenDaysCount: 6
		})

		useReviewCardQueueMock.mockImplementation(
			(params: { type: string; tab?: string; focused?: boolean }) => {
				if (params.type !== 'flashcard') {
					return { data: [], isLoading: false }
				}

				if (params.tab === 'new') {
					return {
						data: Array.from({ length: 4 }, (_, index) => ({
							queue_type: 'new' as const,
							card: {
								...reviewCard,
								id: 100 + index,
								type: 'flashcard' as const,
								prompt: `New flashcard ${index + 1}`
							},
							review_id: null,
							scheduled_at: null,
							days_until_due: null,
							days_until_hazy: null
						})),
						isLoading: false
					}
				}

				if (params.focused) {
					return {
						data: [
							{
								queue_type: 'hazy' as const,
								card: {
									...reviewCard,
									id: 111,
									type: 'flashcard' as const,
									prompt: 'Focused flashcard'
								},
								review_id: null,
								scheduled_at: null,
								days_until_due: null,
								days_until_hazy: 1
							}
						],
						isLoading: false
					}
				}

				return {
					data: [
						{
							queue_type: 'due' as const,
							card: {
								...reviewCard,
								id: 112,
								type: 'flashcard' as const,
								prompt: 'Overdue flashcard'
							},
							review_id: null,
							scheduled_at: '2026-03-04',
							days_until_due: -1,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: {
								...reviewCard,
								id: 113,
								type: 'flashcard' as const,
								prompt: 'Today flashcard A'
							},
							review_id: null,
							scheduled_at: '2026-03-05',
							days_until_due: 0,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: {
								...reviewCard,
								id: 114,
								type: 'flashcard' as const,
								prompt: 'Today flashcard B'
							},
							review_id: null,
							scheduled_at: '2026-03-05',
							days_until_due: 0,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: {
								...reviewCard,
								id: 115,
								type: 'flashcard' as const,
								prompt: 'Soon flashcard A'
							},
							review_id: null,
							scheduled_at: '2026-03-06',
							days_until_due: 1,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: {
								...reviewCard,
								id: 116,
								type: 'flashcard' as const,
								prompt: 'Soon flashcard B'
							},
							review_id: null,
							scheduled_at: '2026-03-07',
							days_until_due: 2,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: {
								...reviewCard,
								id: 117,
								type: 'flashcard' as const,
								prompt: 'Soon flashcard C'
							},
							review_id: null,
							scheduled_at: '2026-03-08',
							days_until_due: 3,
							days_until_hazy: null
						}
					],
					isLoading: false
				}
			}
		)

		render(<FlashcardsHarness />)

		const dueTab = screen.getByRole('tab', { name: 'Due' })
		const newTab = screen.getByRole('tab', { name: 'New' })
		const dueSummary = screen.getByText('Due in next 7d').parentElement

		expect(screen.getByText('Focused flashcard')).toBeInTheDocument()
		expect(within(dueTab).getByText('1')).toBeInTheDocument()
		expect(within(dueTab).getByText('2')).toBeInTheDocument()
		expect(within(newTab).getByText('4')).toBeInTheDocument()
		expect(dueSummary).not.toBeNull()
		expect(within(dueSummary as HTMLElement).getByText('6')).toBeInTheDocument()
	})

	it.each([
		{
			count: 1,
			expectedRows: [['Practice prompt 1']]
		},
		{
			count: 2,
			expectedRows: [['Practice prompt 1', 'Practice prompt 2']]
		},
		{
			count: 3,
			expectedRows: [
				['Practice prompt 1', 'Practice prompt 2', 'Practice prompt 3']
			]
		},
		{
			count: 4,
			expectedRows: [
				['Practice prompt 1', 'Practice prompt 2'],
				['Practice prompt 3', 'Practice prompt 4']
			]
		}
	])(
		'renders focused practice layout rows for $count cards',
		({ count, expectedRows }) => {
			useReviewCardQueueMock.mockReturnValue({
				data: buildPracticeQueueItems(count),
				isLoading: false
			})

			render(<PracticeHarness initialScope='focused' />)

			expect(screen.queryByTestId('masonry-layout')).not.toBeInTheDocument()
			expect(screen.getAllByTestId('review-card')).toHaveLength(count)
			expect(
				screen.getAllByTestId('review-card').map(card => card.textContent)
			).toEqual(expectedRows.flat())

			const rows = screen.getAllByTestId('focused-practice-row')
			expect(rows).toHaveLength(expectedRows.length)
			expect(rows.map(row => row.getAttribute('data-row-size'))).toEqual(
				expectedRows.map(row => row.length.toString())
			)
			expect(
				rows.map(row =>
					within(row)
						.getAllByTestId('review-card')
						.map(card => card.textContent)
				)
			).toEqual(expectedRows)
		}
	)

	it('renders five focused practice cards as 2/2/1 below xl', async () => {
		window.happyDOM?.setViewport({ height: 1100, width: 900 })
		useReviewCardQueueMock.mockReturnValue({
			data: buildPracticeQueueItems(5),
			isLoading: false
		})

		render(<PracticeHarness initialScope='focused' />)

		await waitFor(() => {
			const rows = screen.getAllByTestId('focused-practice-row')
			expect(rows.map(row => row.getAttribute('data-row-size'))).toEqual([
				'2',
				'2',
				'1'
			])
		})
		expect(
			screen.getAllByTestId('review-card').map(card => card.textContent)
		).toEqual([
			'Practice prompt 1',
			'Practice prompt 2',
			'Practice prompt 3',
			'Practice prompt 4',
			'Practice prompt 5'
		])
	})

	it('renders five focused practice cards as 3/2 at xl and above', async () => {
		window.happyDOM?.setViewport({ height: 1200, width: 1440 })
		useReviewCardQueueMock.mockReturnValue({
			data: buildPracticeQueueItems(5),
			isLoading: false
		})

		render(<PracticeHarness initialScope='focused' />)

		await waitFor(() => {
			const rows = screen.getAllByTestId('focused-practice-row')
			expect(rows.map(row => row.getAttribute('data-row-size'))).toEqual([
				'3',
				'2'
			])
		})
		expect(
			screen.getAllByTestId('review-card').map(card => card.textContent)
		).toEqual([
			'Practice prompt 1',
			'Practice prompt 2',
			'Practice prompt 3',
			'Practice prompt 4',
			'Practice prompt 5'
		])
	})

	it('renders the due scope controls inline above focused practice content', () => {
		useReviewCardQueueMock.mockReturnValue({
			data: buildPracticeQueueItems(2),
			isLoading: false
		})

		render(<PracticeHarness initialScope='focused' />)

		const scopeBar = screen.getByTestId('review-queue-scope-bar')
		const focusedLayout = screen.getByTestId('focused-practice-layout')

		expect(scopeBar.closest('.sticky')).toBeNull()
		expect(scopeBar).toContainElement(
			screen.getByRole('tab', { name: 'Focused' })
		)
		expect(scopeBar).toContainElement(screen.getByText('Due in next 7d'))
		// biome-ignore lint/nursery/noBitwiseOperators: compareDocumentPosition returns a bitmask
		expect(
			scopeBar.compareDocumentPosition(focusedLayout) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy()
	})

	it('renders Flashcards new cards grouped by creation date without due scope tabs', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-03-05T12:00:00.000Z'))
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'new',
					card: {
						...reviewCard,
						id: 41,
						prompt: 'Today flashcard',
						inserted_at: '2026-03-05T12:00:00.000Z'
					},
					review_id: null,
					scheduled_at: null,
					days_until_due: null
				},
				{
					queue_type: 'new',
					card: {
						...reviewCard,
						id: 42,
						prompt: 'Yesterday flashcard',
						inserted_at: '2026-03-04T12:00:00.000Z'
					},
					review_id: null,
					scheduled_at: null,
					days_until_due: null
				}
			],
			isLoading: false
		})

		try {
			render(<FlashcardsHarness initialTab='new' />)

			expect(
				screen.queryByRole('tab', { name: 'Focused' })
			).not.toBeInTheDocument()
			expect(screen.queryByRole('tab', { name: 'All' })).not.toBeInTheDocument()
			expect(screen.getAllByText(/^Today/)).toHaveLength(2)
			expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
			expect(screen.getByText('Today flashcard')).toBeInTheDocument()
			expect(screen.getByText('Yesterday flashcard')).toBeInTheDocument()
		} finally {
			vi.useRealTimers()
		}
	})

	it('renders Practice new cards grouped by creation date without due scope tabs', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-03-05T12:00:00.000Z'))
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'new',
					card: {
						...reviewCard,
						id: 51,
						prompt: 'Today practice',
						inserted_at: '2026-03-05T12:00:00.000Z'
					},
					review_id: null,
					scheduled_at: null,
					days_until_due: null
				},
				{
					queue_type: 'new',
					card: {
						...reviewCard,
						id: 52,
						prompt: 'Earlier this week practice',
						inserted_at: '2026-03-03T12:00:00.000Z'
					},
					review_id: null,
					scheduled_at: null,
					days_until_due: null
				},
				{
					queue_type: 'new',
					card: {
						...reviewCard,
						id: 53,
						prompt: 'Last week practice',
						inserted_at: '2026-02-26T12:00:00.000Z'
					},
					review_id: null,
					scheduled_at: null,
					days_until_due: null
				}
			],
			isLoading: false
		})

		try {
			render(<PracticeHarness initialTab='new' />)

			expect(
				screen.queryByRole('tab', { name: 'Focused' })
			).not.toBeInTheDocument()
			expect(screen.queryByRole('tab', { name: 'All' })).not.toBeInTheDocument()
			expect(screen.getAllByText(/^Today/)).toHaveLength(2)
			expect(screen.getByText('Tuesday')).toBeInTheDocument()
			expect(screen.getByText('Last week')).toBeInTheDocument()
			expect(screen.getByText('Today practice')).toBeInTheDocument()
			expect(screen.getByText('Earlier this week practice')).toBeInTheDocument()
			expect(screen.getByText('Last week practice')).toBeInTheDocument()
		} finally {
			vi.useRealTimers()
		}
	})
})
