import { useNavigate } from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReviewCardDetailPage } from '~/app/pages/ReviewCardDetailPage'
import { TopicDetailPage } from '~/app/pages/TopicDetailPage'

const navigateMock = vi.fn()
const useTopicMock = vi.fn()
const useTopicsMock = vi.fn()
const useReviewCardsMock = vi.fn()
const useSearchAllMock = vi.fn()
const useReviewCardMock = vi.fn()
const updateTopicAsyncMock = vi.fn()
const createTopicAsyncMock = vi.fn()
const updateReviewCardAsyncMock = vi.fn()
const useReviewsByReviewCardMock = vi.fn()

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		useNavigate: vi.fn()
	}
})

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
				<div key={getItemKey?.(item, index) ?? index}>
					{renderItem(item, index, 320)}
				</div>
			))}
		</div>
	)
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
		),
		DropdownMenuSeparator: () => <hr />
	}
})

vi.mock('~/components/ui/dialog', () => ({
	Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
		open ? <div>{children}</div> : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogDescription: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>
}))

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

vi.mock('~/components/ui/detail-nav-bar', () => ({
	DetailNavBar: ({
		leftContent,
		afterActions
	}: {
		leftContent?: ReactNode
		afterActions?: ReactNode
	}) => (
		<div>
			{leftContent}
			{afterActions}
		</div>
	)
}))

vi.mock('~/features/topics/components/TopicCard', () => ({
	TopicCard: ({
		topic,
		onClick
	}: {
		topic: { title: string }
		onClick?: () => void
	}) => (
		<button onClick={onClick} type='button'>
			{topic.title}
		</button>
	)
}))

vi.mock('~/features/review-cards/components/ReviewCard', () => ({
	ReviewCard: ({
		reviewCard,
		onClick
	}: {
		reviewCard: { prompt: string }
		onClick?: () => void
	}) => (
		<button onClick={onClick} type='button'>
			{reviewCard.prompt}
		</button>
	)
}))

vi.mock('~/features/search/api/searchAll', () => ({
	useSearchAll: (...args: Array<unknown>) => useSearchAllMock(...args)
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

vi.mock('~/features/topics/api/updateTopic', () => ({
	useUpdateTopic: () => ({
		mutateAsync: updateTopicAsyncMock,
		isPending: false
	})
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

vi.mock('~/features/review-cards/api/createReviewCard', () => ({
	useCreateReviewCard: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/review-cards/api/getReviewCard', () => ({
	useReviewCard: (...args: Array<unknown>) => useReviewCardMock(...args)
}))

vi.mock('~/features/review-cards/api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({
		mutateAsync: updateReviewCardAsyncMock,
		isPending: false
	})
}))

vi.mock('~/features/review-cards/api/deleteReviewCard', () => ({
	useDeleteReviewCard: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/reviews/api/createReview', () => ({
	useCreateReview: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('~/features/reviews/api/getReviews', () => ({
	useReviewsByReviewCard: (...args: Array<unknown>) =>
		useReviewsByReviewCardMock(...args)
}))

vi.mock('~/features/reviews/hooks/useDetailReviewCounts', () => ({
	useDetailReviewCounts: () => ({
		unscheduledCount: 0,
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

vi.mock('~/stores/ReviewModeContext', () => ({
	useReviewMode: () => ({
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

const parentTopic = {
	...topic,
	id: 2,
	title: 'Mathematics'
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
	pinned_at: null,
	last_reviewed_at: null,
	retrievability: null,
	freshness_tier: null,
	days_until_next_tier: null,
	days_in_current_tier: null,
	is_new: true,
	status_badges: []
}

beforeEach(() => {
	vi.mocked(useNavigate).mockReturnValue(navigateMock)
	navigateMock.mockReset()
	useTopicMock.mockReset()
	useTopicsMock.mockReset()
	useReviewCardsMock.mockReset()
	useSearchAllMock.mockReset()
	useReviewCardMock.mockReset()
	updateTopicAsyncMock.mockReset()
	createTopicAsyncMock.mockReset()
	updateReviewCardAsyncMock.mockReset()
	useReviewsByReviewCardMock.mockReset()

	useTopicMock.mockImplementation((topicId: number | null) => {
		if (topicId === 1) {
			return { data: topic, isLoading: false, error: null }
		}
		if (topicId === 2) {
			return { data: parentTopic, isLoading: false, error: null }
		}
		return { data: null, isLoading: false, error: null }
	})
	useTopicsMock.mockReturnValue({ data: [], isLoading: false })
	useReviewCardsMock.mockReturnValue({ data: [], isLoading: false })
	useSearchAllMock.mockReturnValue({
		data: [
			{
				entity_type: 'topic',
				topic,
				review_card: null,
				recent_activity_at: '2026-03-05T09:00:00.000Z'
			},
			{
				entity_type: 'topic',
				topic: parentTopic,
				review_card: null,
				recent_activity_at: '2026-03-05T08:00:00.000Z'
			}
		],
		isLoading: false
	})
	useReviewCardMock.mockReturnValue({
		data: reviewCard,
		isLoading: false,
		error: null
	})
	useReviewsByReviewCardMock.mockReturnValue({
		data: [],
		isLoading: false
	})
})

describe('legacy-style detail parent and topic controls', () => {
	it('shows Add parent and assigns a searched parent topic', async () => {
		const user = userEvent.setup()

		render(
			<TopicDetailPage
				activeHomeTab='subtopics'
				cardTypeFilter='all'
				onActiveHomeTabChange={vi.fn()}
				onCardTypeFilterChange={vi.fn()}
				topicId={1}
			/>
		)

		expect(
			screen.getByRole('button', { name: /Add parent/i })
		).toBeInTheDocument()
		expect(screen.queryByText('No parent')).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: /^Search$/i }))

		expect(
			screen.queryByRole('button', { name: topic.title })
		).not.toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: parentTopic.title }))

		await waitFor(() => {
			expect(updateTopicAsyncMock).toHaveBeenCalledWith({
				id: 1,
				parent_id: 2
			})
		})
	})

	it('creates and assigns a parent topic from TopicDetail', async () => {
		const user = userEvent.setup()
		createTopicAsyncMock.mockResolvedValue({ id: 3 })
		updateTopicAsyncMock.mockResolvedValue(undefined)

		render(
			<TopicDetailPage
				activeHomeTab='subtopics'
				cardTypeFilter='all'
				onActiveHomeTabChange={vi.fn()}
				onCardTypeFilterChange={vi.fn()}
				topicId={1}
			/>
		)

		await user.click(screen.getByRole('button', { name: /^Create$/i }))

		await waitFor(() => {
			expect(createTopicAsyncMock).toHaveBeenCalledWith({
				title: '',
				body: '',
				parent_id: null
			})
		})
		expect(updateTopicAsyncMock).toHaveBeenCalledWith({
			id: 1,
			parent_id: 3
		})
	})

	it('removes an existing parent from TopicDetail', async () => {
		const user = userEvent.setup()
		useTopicMock.mockImplementation((topicId: number | null) => {
			if (topicId === 1) {
				return {
					data: { ...topic, parent_id: 2, parent_title: parentTopic.title },
					isLoading: false,
					error: null
				}
			}
			if (topicId === 2) {
				return { data: parentTopic, isLoading: false, error: null }
			}
			return { data: null, isLoading: false, error: null }
		})

		render(
			<TopicDetailPage
				activeHomeTab='subtopics'
				cardTypeFilter='all'
				onActiveHomeTabChange={vi.fn()}
				onCardTypeFilterChange={vi.fn()}
				topicId={1}
			/>
		)

		await user.click(screen.getByRole('button', { name: /Remove parent/i }))

		expect(updateTopicAsyncMock).toHaveBeenCalledWith({
			id: 1,
			parent_id: null
		})
	})

	it('keeps the review-card topic pill navigable and reassigns through search', async () => {
		const user = userEvent.setup()
		updateReviewCardAsyncMock.mockResolvedValue(undefined)

		render(<ReviewCardDetailPage reviewCardId={11} />)

		await user.click(
			screen.getByRole('button', { name: reviewCard.topic_title })
		)

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '1' },
			search: { tab: 'subtopics' }
		})
		expect(
			screen.getByRole('button', { name: /Change topic/i })
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: /^Search$/i }))
		expect(
			screen.getAllByRole('button', { name: reviewCard.topic_title })
		).toHaveLength(1)
		await user.click(screen.getByRole('button', { name: parentTopic.title }))

		await waitFor(() => {
			expect(updateReviewCardAsyncMock).toHaveBeenCalledWith({
				id: 11,
				topic_id: 2
			})
		})
		expect(
			screen.queryByRole('button', { name: /Remove topic/i })
		).not.toBeInTheDocument()
	})

	it('creates and assigns a new topic from ReviewCardDetail', async () => {
		const user = userEvent.setup()
		createTopicAsyncMock.mockResolvedValue({ id: 4 })
		updateReviewCardAsyncMock.mockResolvedValue(undefined)

		render(<ReviewCardDetailPage reviewCardId={11} />)

		await user.click(screen.getByRole('button', { name: /^Create$/i }))

		await waitFor(() => {
			expect(createTopicAsyncMock).toHaveBeenCalledWith({
				title: '',
				body: '',
				parent_id: null
			})
		})
		expect(updateReviewCardAsyncMock).toHaveBeenCalledWith({
			id: 11,
			topic_id: 4
		})
	})

	it('pins a review card from ReviewCardDetail', async () => {
		const user = userEvent.setup()
		updateReviewCardAsyncMock.mockResolvedValue(undefined)

		render(<ReviewCardDetailPage reviewCardId={11} />)

		await user.click(screen.getByRole('button', { name: /Pin this item/i }))

		await waitFor(() => {
			expect(updateReviewCardAsyncMock).toHaveBeenCalledWith({
				id: 11,
				pinned: true
			})
		})
	})
})
