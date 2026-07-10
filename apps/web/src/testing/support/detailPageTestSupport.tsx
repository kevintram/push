import { useNavigate } from '@tanstack/react-router'
import { type ReactElement, type ReactNode } from 'react'
import { beforeEach, vi } from 'vitest'

export const elementSizeMock = { ref: () => {}, width: 1024, height: 0 }
export const navigateMock = vi.fn()
export const useTopicMock = vi.fn()
export const useTopicsMock = vi.fn()
export const useReviewCardsMock = vi.fn()
export const useSearchAllMock = vi.fn()
export const useReviewCardMock = vi.fn()
export const updateTopicAsyncMock = vi.fn()
export const createTopicAsyncMock = vi.fn()
export const createReviewCardAsyncMock = vi.fn()
export const updateReviewCardAsyncMock = vi.fn()
export const useReviewsByReviewCardMock = vi.fn()
export const reviewsMenuPropsMock = vi.fn()
export const useDetailReviewCountsMock = vi.fn()

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-router')>()
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
			select,
		}: {
			select: (state: { location: { hash: string } }) => unknown
		}) => select({ location: { hash: '' } }),
	}
})

vi.mock('~/hooks/useResizeObserver', () => ({
	useElementSize: () => elementSizeMock,
	useResizeObserver: () => [
		() => {},
		{
			width: 1024,
			height: 0,
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
		},
	],
}))

vi.mock('~/components/masonry-layout/MasonryLayout', () => ({
	MasonryLayout: ({
		items,
		renderItem,
		getItemKey,
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
	),
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
						(render as ReactElement<{ children?: ReactNode }>).props
							.children,
				)
			) : (
				<button type='button' {...props}>
					{children}
				</button>
			),
		DropdownMenuContent: ({ children }: { children: ReactNode }) => (
			<div>{children}</div>
		),
		DropdownMenuGroup: ({ children }: { children: ReactNode }) => (
			<div>{children}</div>
		),
		DropdownMenuItem: ({
			children,
			onClick,
			disabled,
		}: {
			children: ReactNode
			onClick?: () => void
			disabled?: boolean
		}) => (
			<button disabled={disabled} onClick={onClick} type='button'>
				{children}
			</button>
		),
		DropdownMenuSeparator: () => <hr />,
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
	DialogTitle: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}))

vi.mock('~/components/ui/tooltip', () => ({
	Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
	TooltipTrigger: ({
		render,
		children,
	}: {
		render?: ReactNode
		children?: ReactNode
	}) => <>{render ?? children}</>,
	TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('~/components/ui/detail-nav-bar', () => ({
	DetailNavBar: ({
		leftContent,
		afterActions,
	}: {
		leftContent?: ReactNode
		afterActions?: ReactNode
	}) => (
		<div>
			{leftContent}
			{afterActions}
		</div>
	),
}))

vi.mock('~/modules/topics/components/TopicCard', () => ({
	TopicCard: ({
		topic,
		onClick,
	}: {
		topic: { title: string }
		onClick?: () => void
	}) => (
		<button onClick={onClick} type='button'>
			{topic.title}
		</button>
	),
}))

vi.mock('~/modules/review-cards/components/ReviewCard', () => ({
	ReviewCard: ({
		reviewCard,
		onClick,
	}: {
		reviewCard: { primaryText: string }
		onClick?: () => void
	}) => (
		<button onClick={onClick} type='button'>
			{reviewCard.primaryText}
		</button>
	),
}))

vi.mock('~/modules/search/api/searchAll', () => ({
	useSearchAll: (...args: Array<unknown>) => useSearchAllMock(...args),
}))

vi.mock('~/modules/topics/api/getTopic', () => ({
	useTopic: (...args: Array<unknown>) => useTopicMock(...args),
}))

vi.mock('~/modules/topics/api/getTopics', () => ({
	useTopics: (...args: Array<unknown>) => useTopicsMock(...args),
}))

vi.mock('~/modules/review-cards/api/getReviewCards', () => ({
	useReviewCards: (...args: Array<unknown>) => useReviewCardsMock(...args),
}))

vi.mock('~/modules/topics/api/updateTopic', () => ({
	useUpdateTopic: () => ({
		mutateAsync: updateTopicAsyncMock,
		isPending: false,
	}),
}))

vi.mock('~/modules/topics/api/createTopic', () => ({
	useCreateTopic: () => ({
		mutateAsync: createTopicAsyncMock,
		isPending: false,
	}),
}))

vi.mock('~/modules/topics/api/deleteTopic', () => ({
	useDeleteTopic: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('~/modules/review-cards/api/createReviewCard', () => ({
	useCreateReviewCard: () => ({
		mutateAsync: createReviewCardAsyncMock,
		isPending: false,
	}),
}))

vi.mock('~/modules/review-cards/api/getReviewCard', () => ({
	useReviewCard: (...args: Array<unknown>) => useReviewCardMock(...args),
}))

vi.mock('~/modules/review-cards/api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({
		mutateAsync: updateReviewCardAsyncMock,
		isPending: false,
	}),
}))

vi.mock('~/modules/review-cards/api/deleteReviewCard', () => ({
	useDeleteReviewCard: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('~/modules/review-cards/hooks/useDeleteReviewCardWithUndo', () => ({
	useDeleteReviewCardWithUndo: () => ({ deleteWithUndo: vi.fn() }),
}))

vi.mock('~/modules/reviews/api/createReview', () => ({
	useCreateReview: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('~/modules/reviews/components/RatingDropdown', () => ({
	RatingDropdown: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>,
}))

vi.mock('~/modules/reviews/components/reviews-menu/ReviewsMenu', () => ({
	ReviewsMenu: (props: unknown) => {
		reviewsMenuPropsMock(props)
		return <button type='button'>Reviews</button>
	},
}))

vi.mock('~/modules/reviews/api/getReviews', () => ({
	useReviewsByReviewCard: (...args: Array<unknown>) =>
		useReviewsByReviewCardMock(...args),
}))

vi.mock('~/modules/reviews/hooks/useDetailReviewCounts', () => ({
	useDetailReviewCounts: (...args: Array<unknown>) =>
		useDetailReviewCountsMock(...args),
}))

vi.mock('~/modules/reviews/hooks/useReviewDialog', () => ({
	useReviewDialog: () => ({ openReviewDialog: vi.fn() }),
}))

vi.mock('~/hooks/useLearnableMetrics', () => ({
	useLearnableMetrics: () => ({
		freshnessTierInfo: { label: 'Fresh', tooltip: null },
		freshnessTierColor: 'text-green-600',
		isUnreviewed: true,
		stabilityText: '1d',
	}),
}))

vi.mock('~/stores/ReviewModeContext', async importOriginal => {
	const actual =
		await importOriginal<typeof import('~/stores/ReviewModeContext')>()

	return {
		...actual,
		useReviewMode: () => ({
			hidesPrimary: false,
			hidesSecondary: false,
		}),
	}
})

export const topic = {
	id: 1,
	title: 'Algebra',
	body: 'Working with expressions',
	parentId: null,
	parentTitle: null,
	insertedAt: '2026-03-01T12:00:00.000Z',
	updatedAt: '2026-03-04T12:00:00.000Z',
}

export const parentTopic = {
	...topic,
	id: 2,
	title: 'Mathematics',
}

export const reviewCard = {
	id: 11,
	topicId: 1,
	topicTitle: 'Algebra',
	type: 'practice' as const,
	primaryText: 'Solve for x',
	secondaryText: 'x = 3',
	notes: 'Factor carefully',
	insertedAt: '2026-03-01T12:00:00.000Z',
	updatedAt: '2026-03-04T12:00:00.000Z',
	lastReviewRating: null,
	stability: null,
	difficulty: null,
	state: 'new',
	step: null,
	retired: false,
	flaggedAt: null,
	lastReviewedAt: null,
	retrievability: null,
	freshnessTier: null,
	daysUntilNextTier: null,
	daysInCurrentTier: null,
	isNew: true,
	statusBadges: [],
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
	createReviewCardAsyncMock.mockReset()
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
				entityType: 'topic',
				topic,
				reviewCard: null,
				recentActivityAt: '2026-03-05T09:00:00.000Z',
			},
			{
				entityType: 'topic',
				topic: parentTopic,
				reviewCard: null,
				recentActivityAt: '2026-03-05T08:00:00.000Z',
			},
		],
		isLoading: false,
	})
	useReviewCardMock.mockReturnValue({
		data: reviewCard,
		isLoading: false,
		error: null,
	})
	useReviewsByReviewCardMock.mockReturnValue({
		data: [],
		isLoading: false,
	})
	useDetailReviewCountsMock.mockReturnValue({
		pendingCount: 2,
		overdueCount: 1,
		dueTodayCount: 3,
	})
})
