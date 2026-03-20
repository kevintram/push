import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReviewsMenu } from './ReviewsMenu'

const navigateMock = vi.fn()
const useQueryMock = vi.fn()
const createReviewMock = vi.fn()
const openReviewDialogMock = vi.fn()

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQuery: (...args: Array<unknown>) => useQueryMock(...args)
	}
})

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		useNavigate: () => navigateMock
	}
})

vi.mock('~/components/ui/dropdown-menu', () => ({
	DropdownMenu: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuTrigger: ({ render }: { render: ReactNode }) => <>{render}</>,
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
		title
	}: {
		children: ReactNode
		onClick?: () => void
		disabled?: boolean
		title?: string
	}) => (
		<button disabled={disabled} onClick={onClick} title={title} type='button'>
			{children}
		</button>
	),
	DropdownMenuLabel: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuSub: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuSubTrigger: ({
		children,
		disabled
	}: {
		children: ReactNode
		disabled?: boolean
	}) => (
		<button disabled={disabled} type='button'>
			{children}
		</button>
	),
	DropdownMenuSubContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	)
}))

vi.mock('~/features/reviews/api/createReview', () => ({
	useCreateReview: () => ({
		mutateAsync: createReviewMock,
		isPending: false
	})
}))

vi.mock('./ReviewItem', () => ({
	ReviewItem: ({
		entry,
		onReviewClick
	}: {
		entry: {
			id: number
			description?: string | null
			effective_date?: string | null
		}
		onReviewClick?: (reviewId: number) => void
	}) =>
		onReviewClick ? (
			<button
				data-testid={`review-item-${entry.id}`}
				onClick={() => onReviewClick(entry.id)}
				type='button'
			>
				{entry.description?.trim() || 'No description'}
				{entry.effective_date ? ` ${entry.effective_date}` : ''}
			</button>
		) : (
			<div data-testid={`review-item-${entry.id}`}>
				{entry.description?.trim() || 'No description'}
				{entry.effective_date ? ` ${entry.effective_date}` : ''}
			</div>
		)
}))

vi.mock('~/features/reviews/hooks/useReviewDialog', () => ({
	useReviewDialog: () => ({
		openReviewDialog: openReviewDialogMock
	})
}))

vi.mock('sonner', () => ({
	toast: Object.assign(vi.fn(), {
		error: vi.fn()
	})
}))

vi.mock('~/utils/date', () => ({
	localDateString: () => '2026-03-19'
}))

describe('ReviewsMenu', () => {
	beforeEach(() => {
		navigateMock.mockReset()
		useQueryMock.mockReset()
		createReviewMock.mockReset()
		openReviewDialogMock.mockReset()

		useQueryMock.mockReturnValue({
			data: [
				{
					id: 101,
					review_card_id: 12,
					rating: null,
					description: 'Catch-up prompt',
					notes: '',
					scheduled_at: '2026-03-18',
					completed_at: null,
					effective_date: '2026-03-18',
					inserted_at: '2026-03-17T12:00:00.000Z',
					updated_at: '2026-03-17T12:00:00.000Z',
					review_card: {
						id: 12,
						topic_id: 1,
						type: 'practice',
						prompt: 'Prompt',
						answer: 'Answer'
					},
					stability_before: null,
					difficulty_before: null,
					state_before: null,
					step_before: null,
					due_before: null,
					stability_after: null,
					difficulty_after: null,
					state_after: null,
					step_after: null,
					due_after: null
				},
				{
					id: 102,
					review_card_id: 12,
					rating: null,
					description: '',
					notes: '',
					scheduled_at: '2026-03-19',
					completed_at: null,
					effective_date: '2026-03-19',
					inserted_at: '2026-03-18T12:00:00.000Z',
					updated_at: '2026-03-18T12:00:00.000Z',
					review_card: {
						id: 12,
						topic_id: 1,
						type: 'practice',
						prompt: 'Prompt',
						answer: 'Answer'
					},
					stability_before: null,
					difficulty_before: null,
					state_before: null,
					step_before: null,
					due_before: null,
					stability_after: null,
					difficulty_after: null,
					state_after: null,
					step_after: null,
					due_after: null
				},
				{
					id: 103,
					review_card_id: 12,
					rating: 'good',
					description: 'Strong recall',
					notes: '',
					scheduled_at: null,
					completed_at: '2026-03-17',
					effective_date: '2026-03-17',
					inserted_at: '2026-03-17T12:00:00.000Z',
					updated_at: '2026-03-17T12:00:00.000Z',
					review_card: {
						id: 12,
						topic_id: 1,
						type: 'practice',
						prompt: 'Prompt',
						answer: 'Answer'
					},
					stability_before: null,
					difficulty_before: null,
					state_before: null,
					step_before: null,
					due_before: null,
					stability_after: null,
					difficulty_after: null,
					state_after: null,
					step_after: null,
					due_after: null
				},
				{
					id: 104,
					review_card_id: 12,
					rating: null,
					description: 'Draft follow-up',
					notes: '',
					scheduled_at: null,
					completed_at: null,
					effective_date: null,
					inserted_at: '2026-03-16T12:00:00.000Z',
					updated_at: '2026-03-16T12:00:00.000Z',
					review_card: {
						id: 12,
						topic_id: 1,
						type: 'practice',
						prompt: 'Prompt',
						answer: 'Answer'
					},
					stability_before: null,
					difficulty_before: null,
					state_before: null,
					step_before: null,
					due_before: null,
					stability_after: null,
					difficulty_after: null,
					state_after: null,
					step_after: null,
					due_after: null
				}
			]
		})

		createReviewMock.mockResolvedValue({
			id: 999,
			completed_at: '2026-03-19',
			scheduled_at: null,
			stability_before: null,
			stability_after: null,
			due_after: null
		})
	})

	it('renders add, due reviews, last reviewed, and the unscheduled count badge', () => {
		render(<ReviewsMenu reviewCardId={12} />)

		const trigger = screen.getByRole('button', { name: /Reviews/i })
		expect(trigger).toBeInTheDocument()
		expect(
			within(trigger).getByTestId('reviews-trigger-unscheduled-count')
		).toHaveTextContent('1')
		expect(
			within(trigger).getByTestId('reviews-trigger-overdue-count')
		).toHaveTextContent('1')
		expect(
			within(trigger).getByTestId('reviews-trigger-due-today-count')
		).toHaveTextContent('1')
		expect(screen.getByText('Create new')).toBeInTheDocument()
		expect(screen.getByText('Due')).toBeInTheDocument()
		expect(screen.getByTestId('review-item-101')).toBeInTheDocument()
		expect(screen.getByTestId('review-item-102')).toBeInTheDocument()
		expect(screen.getByText('Last reviewed')).toBeInTheDocument()
		expect(screen.getByTestId('review-item-103')).toBeInTheDocument()
		expect(screen.getByText('See all')).toBeInTheDocument()
		expect(screen.getAllByText('1')).toHaveLength(4)
	})

	it('opens reviews, delegates see-all, and creates a rated review from the add submenu', async () => {
		const user = userEvent.setup()
		const onSeeAll = vi.fn()

		render(<ReviewsMenu onSeeAll={onSeeAll} reviewCardId={12} />)

		await user.click(screen.getByRole('button', { name: /Catch-up prompt/i }))
		expect(openReviewDialogMock).toHaveBeenCalledWith(101)

		await user.click(screen.getByRole('button', { name: /Strong recall/i }))
		expect(openReviewDialogMock).toHaveBeenCalledWith(103)

		await user.click(screen.getByRole('button', { name: /Good/i }))
		expect(createReviewMock).toHaveBeenCalledWith({
			review_card_id: 12,
			rating: 'good',
			description: '',
			scheduled_at: null,
			completed_at: '2026-03-19'
		})

		await user.click(screen.getByRole('button', { name: /See all/i }))
		expect(onSeeAll).toHaveBeenCalled()
	})

	it('omits the see-all badge when there are no unscheduled uncompleted reviews', () => {
		useQueryMock.mockReturnValueOnce({
			data: [
				{
					id: 201,
					review_card_id: 12,
					rating: 'good',
					description: 'Completed only',
					notes: '',
					scheduled_at: null,
					completed_at: '2026-03-17',
					effective_date: '2026-03-17',
					inserted_at: '2026-03-17T12:00:00.000Z',
					updated_at: '2026-03-17T12:00:00.000Z',
					review_card: {
						id: 12,
						topic_id: 1,
						type: 'practice',
						prompt: 'Prompt',
						answer: 'Answer'
					},
					stability_before: null,
					difficulty_before: null,
					state_before: null,
					step_before: null,
					due_before: null,
					stability_after: null,
					difficulty_after: null,
					state_after: null,
					step_after: null,
					due_after: null
				}
			]
		})

		render(<ReviewsMenu reviewCardId={12} />)

		const trigger = screen.getByRole('button', { name: /Reviews/i })

		expect(screen.getByText('See all')).toBeInTheDocument()
		expect(screen.queryByText('0')).not.toBeInTheDocument()
		expect(
			within(trigger).queryByTestId('reviews-trigger-unscheduled-count')
		).not.toBeInTheDocument()
		expect(
			within(trigger).queryByTestId('reviews-trigger-overdue-count')
		).not.toBeInTheDocument()
		expect(
			within(trigger).queryByTestId('reviews-trigger-due-today-count')
		).not.toBeInTheDocument()
	})
})
