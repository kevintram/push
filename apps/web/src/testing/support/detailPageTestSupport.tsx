import { useNavigate } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import { beforeEach, vi } from 'vitest'

export const navigateMock = vi.fn()
export const useTopicMock = vi.fn()
export const useTopicsMock = vi.fn()
export const useReviewCardsMock = vi.fn()
export const useSearchAllMock = vi.fn()
export const useReviewCardMock = vi.fn()
export const updateTopicAsyncMock = vi.fn()
export const createTopicAsyncMock = vi.fn()
export const updateReviewCardAsyncMock = vi.fn()
export const useReviewsByReviewCardMock = vi.fn()
export const reviewsMenuPropsMock = vi.fn()
export const useDetailReviewCountsMock = vi.fn()

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
		useNavigate: vi.fn(),
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

vi.mock('~/features/reviews/components/RatingDropdown', () => ({
	RatingDropdown: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>
}))

vi.mock('~/features/reviews/components/reviews-menu/ReviewsMenu', () => ({
	ReviewsMenu: (props: unknown) => {
		reviewsMenuPropsMock(props)
		return <button type='button'>Reviews</button>
	}
}))

vi.mock('~/features/reviews/api/getReviews', () => ({
	useReviewsByReviewCard: (...args: Array<unknown>) =>
		useReviewsByReviewCardMock(...args)
}))

vi.mock('~/features/reviews/hooks/useDetailReviewCounts', () => ({
	useDetailReviewCounts: (...args: Array<unknown>) =>
		useDetailReviewCountsMock(...args)
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

export const topic = {
	id: 1,
	title: 'Algebra',
	body: 'Working with expressions',
	parent_id: null,
	parent_title: null,
	inserted_at: '2026-03-01T12:00:00.000Z',
	updated_at: '2026-03-04T12:00:00.000Z'
}

export const parentTopic = {
	...topic,
	id: 2,
	title: 'Mathematics'
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
	reviewsMenuPropsMock.mockReset()
	useDetailReviewCountsMock.mockReset()
	window.sessionStorage.clear()

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
	useDetailReviewCountsMock.mockReturnValue({
		unscheduledCount: 2,
		overdueCount: 1,
		dueTodayCount: 3
	})
})
