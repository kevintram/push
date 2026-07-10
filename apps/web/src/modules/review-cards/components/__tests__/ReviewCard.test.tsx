import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewCard } from '~/modules/review-cards/components/ReviewCard'
import { type ReviewCard as ReviewCardModel } from '~/modules/review-cards/types/review-card.types'

const navigateMock = vi.fn()
const prefetchQueryMock = vi.fn()
const getQueryStateMock = vi.fn()
const updateReviewCardMock = vi.fn()
const createReviewMock = vi.fn()
const openReviewDialogMock = vi.fn()
const reviewsMenuPropsMock = vi.fn()

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQueryClient: () => ({
			prefetchQuery: prefetchQueryMock,
			getQueryState: getQueryStateMock,
		}),
	}
})

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		useNavigate: () => navigateMock,
	}
})

vi.mock('~/hooks/useResizeObserver', () => ({
	useResizeObserver: () => [
		vi.fn(),
		{
			x: 0,
			y: 0,
			width: 320,
			height: 0,
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
		},
	],
}))

vi.mock('~/hooks/useLearnableMetrics', () => ({
	useLearnableMetrics: () => ({
		freshnessTierInfo: {
			label: 'Fresh',
			tooltip: null,
		},
		freshnessTierColor: 'text-emerald-600',
		isUnreviewed: false,
		stabilityText: '10d',
	}),
}))

vi.mock('~/stores/ReviewModeContext', () => ({
	useReviewMode: () => ({
		reviewMode: 'on',
		setReviewMode: vi.fn(),
		isReviewModeEnabled: true,
		hidesPrimary: false,
		hidesSecondary: true,
		showReviewModeWarning: false,
		setShowReviewModeWarning: vi.fn(),
		autoEnableReviewMode: false,
		setAutoEnableReviewMode: vi.fn(),
	}),
}))

vi.mock('~/components/ui/dropdown-menu', () => ({
	DropdownMenu: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuTrigger: ({ render }: { render: ReactNode }) => <>{render}</>,
	DropdownMenuContent: ({ children }: { children: ReactNode }) => (
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

vi.mock('~/components/ui/alert-dialog', () => ({
	AlertDialog: ({ children }: { children: ReactNode }) => <>{children}</>,
	AlertDialogAction: ({ children }: { children: ReactNode }) => (
		<button type='button'>{children}</button>
	),
	AlertDialogCancel: ({ children }: { children: ReactNode }) => (
		<button type='button'>{children}</button>
	),
	AlertDialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogDescription: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogMedia: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogTitle: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}))

vi.mock('~/modules/reviews/components/RatingDropdown', () => ({
	RatingDropdown: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>,
}))

vi.mock('~/modules/reviews/components/reviews-menu/ReviewsMenu', () => ({
	ReviewsMenu: (props: {
		onTriggerFocus?: () => void
		onTriggerMouseEnter?: () => void
		triggerCounts?: {
			pendingCount: number
			overdueCount: number
			dueTodayCount: number
		}
	}) => {
		reviewsMenuPropsMock(props)
		return (
			<button
				onFocus={props.onTriggerFocus}
				onMouseEnter={props.onTriggerMouseEnter}
				type='button'
			>
				Reviews
			</button>
		)
	},
}))

vi.mock('~/modules/reviews/hooks/useReviewDialog', () => ({
	useReviewDialog: () => ({
		openReviewDialog: openReviewDialogMock,
	}),
}))

vi.mock('~/modules/reviews/api/createReview', () => ({
	useCreateReview: () => ({
		mutateAsync: createReviewMock,
		isPending: false,
	}),
}))

vi.mock('~/modules/review-cards/api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({
		mutate: updateReviewCardMock,
		isPending: false,
	}),
}))

vi.mock('~/modules/review-cards/api/deleteReviewCard', () => ({
	useDeleteReviewCard: () => ({
		mutateAsync: vi.fn(),
		isPending: false,
	}),
}))

vi.mock('~/modules/review-cards/components/RetireReviewCardDialog', () => ({
	RetireReviewCardDialog: () => null,
}))

vi.mock('sonner', () => ({
	toast: Object.assign(vi.fn(), {
		error: vi.fn(),
		success: vi.fn(),
	}),
}))

describe('ReviewCard', () => {
	beforeEach(() => {
		navigateMock.mockReset()
		prefetchQueryMock.mockReset()
		getQueryStateMock.mockReset()
		updateReviewCardMock.mockReset()
		createReviewMock.mockReset()
		openReviewDialogMock.mockReset()
		reviewsMenuPropsMock.mockReset()
		getQueryStateMock.mockReturnValue(undefined)
	})

	it('expands focused large cards and focuses the guess textarea', async () => {
		const user = userEvent.setup()
		const reviewCard: ReviewCardModel = {
			id: 42,
			topicId: 9,
			topicTitle: 'Topic',
			type: 'flashcard',
			primaryText: 'Focused prompt',
			secondaryText: 'Long answer '.repeat(120),
			insertedAt: '2026-03-01T00:00:00.000Z',
			updatedAt: '2026-03-01T00:00:00.000Z',
			lastReviewRating: 'good',
			stability: 10,
			difficulty: 3,
			state: 'review',
			step: 2,
			retired: false,
			flaggedAt: null,
			lastReviewedAt: '2026-03-02T00:00:00.000Z',
			retrievability: 0.8,
			freshnessTier: 'Fresh',
			daysUntilNextTier: 3,
			daysInCurrentTier: 1,
			isNew: false,
			statusBadges: [],
			notes: '',
		}

		render(
			<ReviewCard enableLargeCardMode={true} reviewCard={reviewCard} />,
		)

		const card = screen
			.getByText('Focused prompt')
			.closest('[data-slot="card"]') as HTMLElement | null
		expect(card).not.toBeNull()
		expect(card?.className).toContain('max-h-none')
		expect(Number.parseFloat(card?.style.height ?? '0')).toBeGreaterThan(
			500,
		)

		await user.click(screen.getByRole('button', { name: 'Type a guess' }))

		const guessTextarea = screen.getByPlaceholderText(
			'Type your guess here...',
		)
		await waitFor(() => {
			expect(guessTextarea).toHaveFocus()
		})

		await user.type(guessTextarea, 'my guess')
		expect(guessTextarea).toHaveValue('my guess')
	})

	it('shows the guess entry affordance for focused flashcards with short answers', () => {
		const reviewCard: ReviewCardModel = {
			id: 43,
			topicId: 9,
			topicTitle: 'Topic',
			type: 'flashcard',
			primaryText: 'Short prompt',
			secondaryText: 'Short answer',
			insertedAt: '2026-03-01T00:00:00.000Z',
			updatedAt: '2026-03-01T00:00:00.000Z',
			lastReviewRating: 'good',
			stability: 10,
			difficulty: 3,
			state: 'review',
			step: 2,
			retired: false,
			flaggedAt: null,
			lastReviewedAt: '2026-03-02T00:00:00.000Z',
			retrievability: 0.8,
			freshnessTier: 'Fresh',
			daysUntilNextTier: 3,
			daysInCurrentTier: 1,
			isNew: false,
			statusBadges: [],
			notes: '',
		}

		render(
			<ReviewCard enableLargeCardMode={true} reviewCard={reviewCard} />,
		)

		expect(
			screen.getByRole('button', { name: 'Type a guess' }),
		).toBeInTheDocument()
	})

	it('keeps the reveal textarea editable in focused large cards', async () => {
		const user = userEvent.setup()
		const reviewCard: ReviewCardModel = {
			id: 44,
			topicId: 9,
			topicTitle: 'Topic',
			type: 'flashcard',
			primaryText: 'Reveal prompt',
			secondaryText: 'Original answer',
			insertedAt: '2026-03-01T00:00:00.000Z',
			updatedAt: '2026-03-01T00:00:00.000Z',
			lastReviewRating: 'good',
			stability: 10,
			difficulty: 3,
			state: 'review',
			step: 2,
			retired: false,
			flaggedAt: null,
			lastReviewedAt: '2026-03-02T00:00:00.000Z',
			retrievability: 0.8,
			freshnessTier: 'Fresh',
			daysUntilNextTier: 3,
			daysInCurrentTier: 1,
			isNew: false,
			statusBadges: [],
			notes: '',
		}

		render(
			<ReviewCard enableLargeCardMode={true} reviewCard={reviewCard} />,
		)

		await user.click(screen.getByRole('button', { name: 'Reveal' }))

		const revealTextarea = screen.getByRole('textbox')
		await user.clear(revealTextarea)
		await user.type(revealTextarea, 'Edited answer')

		expect(revealTextarea).toHaveValue('Edited answer')
	})

	it('passes trigger counts and prefetches reviews only from the reviews trigger', async () => {
		const user = userEvent.setup()
		const reviewCard: ReviewCardModel = {
			id: 45,
			topicId: 9,
			topicTitle: 'Topic',
			type: 'practice',
			primaryText: 'Prefetch prompt',
			secondaryText: 'Answer',
			insertedAt: '2026-03-01T00:00:00.000Z',
			updatedAt: '2026-03-01T00:00:00.000Z',
			lastReviewRating: 'good',
			stability: 10,
			difficulty: 3,
			state: 'review',
			step: 2,
			retired: false,
			flaggedAt: null,
			lastReviewedAt: '2026-03-02T00:00:00.000Z',
			retrievability: 0.8,
			freshnessTier: 'Fresh',
			daysUntilNextTier: 3,
			daysInCurrentTier: 1,
			isNew: false,
			reviewsPendingCount: 4,
			reviewsOverdueCount: 2,
			reviewsDueTodayCount: 1,
			statusBadges: [],
			notes: '',
		}

		render(<ReviewCard reviewCard={reviewCard} />)

		expect(reviewsMenuPropsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				triggerCounts: {
					pendingCount: 4,
					overdueCount: 2,
					dueTodayCount: 1,
				},
			}),
		)
		expect(prefetchQueryMock).not.toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: ['reviews', 'list', 'reviewCardId', '45'],
			}),
		)

		await user.hover(screen.getByRole('button', { name: 'Reviews' }))

		expect(prefetchQueryMock.mock.calls).toEqual(
			expect.arrayContaining([
				[
					expect.objectContaining({
						queryKey: ['reviews', 'list', 'reviewCardId', '45'],
					}),
				],
			]),
		)
	})

	it('shows the description for practice cards even when review mode hides the secondary text', () => {
		const reviewCard: ReviewCardModel = {
			id: 47,
			topicId: 9,
			topicTitle: 'Topic',
			type: 'practice',
			primaryText: 'Practice prompt',
			secondaryText: 'Practice description',
			insertedAt: '2026-03-01T00:00:00.000Z',
			updatedAt: '2026-03-01T00:00:00.000Z',
			lastReviewRating: 'good',
			stability: 10,
			difficulty: 3,
			state: 'review',
			step: 2,
			retired: false,
			flaggedAt: null,
			lastReviewedAt: '2026-03-02T00:00:00.000Z',
			retrievability: 0.8,
			freshnessTier: 'Fresh',
			daysUntilNextTier: 3,
			daysInCurrentTier: 1,
			isNew: false,
			statusBadges: [],
			notes: '',
		}

		render(
			<ReviewCard enableLargeCardMode={true} reviewCard={reviewCard} />,
		)

		expect(screen.getByText('Practice description')).toBeVisible()
		expect(
			screen.queryByRole('button', { name: 'Reveal' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Type a guess' }),
		).not.toBeInTheDocument()
	})

	it('still hides the description for flashcard cards when review mode is on', () => {
		const reviewCard: ReviewCardModel = {
			id: 48,
			topicId: 9,
			topicTitle: 'Topic',
			type: 'flashcard',
			primaryText: 'Flashcard prompt',
			secondaryText: 'Flashcard answer',
			insertedAt: '2026-03-01T00:00:00.000Z',
			updatedAt: '2026-03-01T00:00:00.000Z',
			lastReviewRating: 'good',
			stability: 10,
			difficulty: 3,
			state: 'review',
			step: 2,
			retired: false,
			flaggedAt: null,
			lastReviewedAt: '2026-03-02T00:00:00.000Z',
			retrievability: 0.8,
			freshnessTier: 'Fresh',
			daysUntilNextTier: 3,
			daysInCurrentTier: 1,
			isNew: false,
			statusBadges: [],
			notes: '',
		}

		render(<ReviewCard reviewCard={reviewCard} />)

		const hiddenAnswer = screen.getByText('Flashcard answer')
		expect(hiddenAnswer).toHaveAttribute('aria-hidden', 'true')
		expect(hiddenAnswer.className).toContain('invisible')
		expect(
			screen.getByRole('button', { name: 'Reveal' }),
		).toBeInTheDocument()
	})

	it('groups topic and type in the header and removes the related-card indicator', () => {
		const reviewCard: ReviewCardModel = {
			id: 46,
			topicId: 9,
			topicTitle: 'Linear algebra',
			type: 'practice',
			primaryText: 'Header prompt',
			secondaryText: 'Header answer',
			insertedAt: '2026-03-01T00:00:00.000Z',
			updatedAt: '2026-03-01T00:00:00.000Z',
			lastReviewRating: 'good',
			stability: 10,
			difficulty: 3,
			state: 'review',
			step: 2,
			retired: false,
			flaggedAt: null,
			lastReviewedAt: '2026-03-02T00:00:00.000Z',
			retrievability: 0.8,
			freshnessTier: 'Fresh',
			daysUntilNextTier: 3,
			daysInCurrentTier: 1,
			isNew: false,
			statusBadges: [],
			notes: '',
		}

		render(<ReviewCard reviewCard={reviewCard} />)

		expect(screen.getAllByText('Linear algebra').length).toBeGreaterThan(0)
		expect(screen.getByText('Practice')).toBeInTheDocument()
		expect(screen.queryByText(/related cards?/iu)).not.toBeInTheDocument()
	})
})
