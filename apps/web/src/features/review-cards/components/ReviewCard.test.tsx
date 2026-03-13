import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import type { ReviewCard as ReviewCardModel } from '~/features/review-cards/types/review-card.types'

const navigateMock = vi.fn()
const prefetchQueryMock = vi.fn()
const updateReviewCardMock = vi.fn()
const createReviewMock = vi.fn()
const openReviewDialogMock = vi.fn()

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQueryClient: () => ({
			prefetchQuery: prefetchQueryMock
		})
	}
})

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		useNavigate: () => navigateMock
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
			right: 0
		}
	]
}))

vi.mock('~/hooks/useLearnableMetrics', () => ({
	useLearnableMetrics: () => ({
		freshnessTierInfo: {
			label: 'Fresh',
			tooltip: null
		},
		freshnessTierColor: 'text-emerald-600',
		isUnreviewed: false,
		stabilityText: '10d'
	})
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
		setAutoEnableReviewMode: vi.fn()
	})
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
		disabled
	}: {
		children: ReactNode
		onClick?: () => void
		disabled?: boolean
	}) => (
		<button disabled={disabled} onClick={onClick} type='button'>
			{children}
		</button>
	)
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
	)
}))

vi.mock('~/features/reviews/components/RatingDropdown', () => ({
	RatingDropdown: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>
}))

vi.mock('~/features/reviews/hooks/useReviewDialog', () => ({
	useReviewDialog: () => ({
		openReviewDialog: openReviewDialogMock
	})
}))

vi.mock('~/features/reviews/api/createReview', () => ({
	useCreateReview: () => ({
		mutateAsync: createReviewMock,
		isPending: false
	})
}))

vi.mock('~/features/review-cards/api/updateReviewCard', () => ({
	useUpdateReviewCard: () => ({
		mutate: updateReviewCardMock,
		isPending: false
	})
}))

vi.mock('~/features/review-cards/api/deleteReviewCard', () => ({
	useDeleteReviewCard: () => ({
		mutateAsync: vi.fn(),
		isPending: false
	})
}))

vi.mock('~/features/review-cards/components/RetireReviewCardDialog', () => ({
	RetireReviewCardDialog: () => null
}))

vi.mock('sonner', () => ({
	toast: Object.assign(vi.fn(), {
		error: vi.fn(),
		success: vi.fn()
	})
}))

describe('ReviewCard', () => {
	beforeEach(() => {
		navigateMock.mockReset()
		prefetchQueryMock.mockReset()
		updateReviewCardMock.mockReset()
		createReviewMock.mockReset()
		openReviewDialogMock.mockReset()
	})

	it('expands focused large cards and focuses the guess textarea', async () => {
		const user = userEvent.setup()
		const reviewCard: ReviewCardModel = {
			id: 42,
			topic_id: 9,
			topic_title: 'Topic',
			type: 'flashcard',
			prompt: 'Focused prompt',
			answer: 'Long answer '.repeat(120),
			inserted_at: '2026-03-01T00:00:00.000Z',
			updated_at: '2026-03-01T00:00:00.000Z',
			last_review_rating: 'good',
			stability: 10,
			difficulty: 3,
			state: 'review',
			step: 2,
			retired: false,
			flagged_at: null,
			last_reviewed_at: '2026-03-02T00:00:00.000Z',
			retrievability: 0.8,
			freshness_tier: 'Fresh',
			days_until_next_tier: 3,
			days_in_current_tier: 1,
			is_new: false,
			status_badges: [],
			notes: ''
		}

		render(<ReviewCard enableLargeCardMode={true} reviewCard={reviewCard} />)

		const card = screen
			.getByText('Focused prompt')
			.closest('[data-slot="card"]') as HTMLElement | null
		expect(card).not.toBeNull()
		expect(card?.className).toContain('max-h-none')
		expect(Number.parseFloat(card?.style.height ?? '0')).toBeGreaterThan(500)

		await user.click(screen.getByRole('button', { name: 'Type a guess' }))

		const guessTextarea = screen.getByPlaceholderText('Type your guess...')
		await waitFor(() => {
			expect(guessTextarea).toHaveFocus()
		})

		await user.type(guessTextarea, 'my guess')
		expect(guessTextarea).toHaveValue('my guess')
	})

	it('shows the guess entry affordance for focused flashcards with short answers', () => {
		const reviewCard: ReviewCardModel = {
			id: 43,
			topic_id: 9,
			topic_title: 'Topic',
			type: 'flashcard',
			prompt: 'Short prompt',
			answer: 'Short answer',
			inserted_at: '2026-03-01T00:00:00.000Z',
			updated_at: '2026-03-01T00:00:00.000Z',
			last_review_rating: 'good',
			stability: 10,
			difficulty: 3,
			state: 'review',
			step: 2,
			retired: false,
			flagged_at: null,
			last_reviewed_at: '2026-03-02T00:00:00.000Z',
			retrievability: 0.8,
			freshness_tier: 'Fresh',
			days_until_next_tier: 3,
			days_in_current_tier: 1,
			is_new: false,
			status_badges: [],
			notes: ''
		}

		render(<ReviewCard enableLargeCardMode={true} reviewCard={reviewCard} />)

		expect(
			screen.getByRole('button', { name: 'Type a guess' })
		).toBeInTheDocument()
	})

	it('keeps the reveal textarea editable in focused large cards', async () => {
		const user = userEvent.setup()
		const reviewCard: ReviewCardModel = {
			id: 44,
			topic_id: 9,
			topic_title: 'Topic',
			type: 'flashcard',
			prompt: 'Reveal prompt',
			answer: 'Original answer',
			inserted_at: '2026-03-01T00:00:00.000Z',
			updated_at: '2026-03-01T00:00:00.000Z',
			last_review_rating: 'good',
			stability: 10,
			difficulty: 3,
			state: 'review',
			step: 2,
			retired: false,
			flagged_at: null,
			last_reviewed_at: '2026-03-02T00:00:00.000Z',
			retrievability: 0.8,
			freshness_tier: 'Fresh',
			days_until_next_tier: 3,
			days_in_current_tier: 1,
			is_new: false,
			status_badges: [],
			notes: ''
		}

		render(<ReviewCard enableLargeCardMode={true} reviewCard={reviewCard} />)

		await user.click(screen.getByRole('button', { name: 'Reveal' }))

		const revealTextarea = screen.getByRole('textbox')
		await user.clear(revealTextarea)
		await user.type(revealTextarea, 'Edited answer')

		expect(revealTextarea).toHaveValue('Edited answer')
	})
})
