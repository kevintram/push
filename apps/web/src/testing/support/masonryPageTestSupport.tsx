import { type ReactNode, useState } from 'react'
import { beforeEach, vi } from 'vitest'
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
import {
	TopicDetailPage,
	type TopicDetailReviewCardFilter
} from '~/app/pages/topic-detail/TopicDetailPage'

export const navigateMock = vi.fn()
export const masonryRenderSpy = vi.fn()
export const masonryPropsSpy = vi.fn()
export const reviewCardRenderSpy = vi.fn()
export const useTopicsMock = vi.fn()
export const useTopicMock = vi.fn()
export const useReviewCardsMock = vi.fn()
export const useReviewCardQueueMock = vi.fn()
export const useReviewCardQueueCountsMock = vi.fn()
export const useSearchAllMock = vi.fn()
export const createTopicAsyncMock = vi.fn()
export const updateReviewCardAsyncMock = vi.fn()

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
		Link: ({
			children,
			to,
			hash,
			params: _params,
			preload: _preload,
			preloadDelay: _preloadDelay,
			search: _search,
			hashScrollIntoView: _hashScrollIntoView,
			resetScroll: _resetScroll,
			...props
		}: {
			children?: ReactNode
			to?: string
			hash?: string
			params?: unknown
			preload?: unknown
			preloadDelay?: unknown
			search?: unknown
			hashScrollIntoView?: unknown
			resetScroll?: unknown
		}) => (
			<a
				data-hash={hash}
				data-to={to}
				href={
					typeof to === 'string'
						? `${to}${hash ? `#${hash}` : ''}`
						: hash
							? `#${hash}`
							: '#'
				}
				{...props}
			>
				{children}
			</a>
		),
		useNavigate: () => navigateMock,
		useRouterState: ({
			select
		}: {
			select: (state: { location: { hash: string } }) => unknown
		}) => select({ location: { hash: '' } })
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

export const topic = {
	id: 1,
	title: 'Algebra',
	body: 'Working with expressions',
	parent_id: null,
	parent_title: null,
	inserted_at: '2026-03-01T12:00:00.000Z',
	updated_at: '2026-03-04T12:00:00.000Z'
}

export const reviewCard = {
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

export function buildPracticeQueueItems(count: number) {
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

export function renderFlashcardsPage({
	initialTab = 'due',
	initialScope = 'focused'
}: {
	initialTab?: FlashcardsTab
	initialScope?: FlashcardsScope
}) {
	function FlashcardsHarnessComponent() {
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

	return <FlashcardsHarnessComponent />
}

export function renderPracticePage({
	initialTab = 'due',
	initialScope = 'all'
}: {
	initialTab?: PracticeTab
	initialScope?: PracticeScope
}) {
	function PracticeHarnessComponent() {
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

	return <PracticeHarnessComponent />
}

export function renderTopicDetailPage({
	initialFilter = 'all'
}: {
	initialFilter?: TopicDetailReviewCardFilter
}) {
	function TopicDetailHarnessComponent() {
		const [cardTypeFilter, setCardTypeFilter] =
			useState<TopicDetailReviewCardFilter>(initialFilter)

		return (
			<TopicDetailPage
				cardTypeFilter={cardTypeFilter}
				onCardTypeFilterChange={setCardTypeFilter}
				topicId={1}
			/>
		)
	}

	return <TopicDetailHarnessComponent />
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
