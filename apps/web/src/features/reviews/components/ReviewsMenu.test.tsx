import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReviewsMenu } from './ReviewsMenu'

const navigateMock = vi.fn()
const useQueryMock = vi.fn()
const invalidateQueriesMock = vi.fn()
const createReviewMock = vi.fn()
const openReviewDialogMock = vi.fn()

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQuery: (...args: Array<unknown>) => useQueryMock(...args),
		useQueryClient: () => ({
			invalidateQueries: invalidateQueriesMock
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

vi.mock('~/components/ui/dropdown-menu', async () => {
	const React = await import('react')
	const MenuContext = React.createContext<{
		open: boolean
		setOpen: (open: boolean, details?: { reason?: string }) => void
	}>({
		open: false,
		setOpen: () => {}
	})

	return {
		DropdownMenu: ({
			children,
			onOpenChange,
			open
		}: {
			children: ReactNode
			onOpenChange?: (open: boolean) => void
			open?: boolean
		}) => {
			const [internalOpen, setInternalOpen] = React.useState(false)
			const resolvedOpen = open ?? internalOpen
			const setOpen = (nextOpen: boolean, details?: { reason?: string }) => {
				if (open === undefined) {
					setInternalOpen(nextOpen)
				}
				if (onOpenChange) {
					;(
						onOpenChange as (
							open: boolean,
							details?: { reason?: string }
						) => void
					)(nextOpen, details)
				}
			}

			return (
				<MenuContext.Provider value={{ open: resolvedOpen, setOpen }}>
					<div>{children}</div>
				</MenuContext.Provider>
			)
		},
		DropdownMenuTrigger: ({ render }: { render: ReactNode }) => {
			const { open, setOpen } = React.useContext(MenuContext)

			if (!React.isValidElement(render)) return <>{render}</>

			const triggerElement = render as React.ReactElement<{
				onClick?: (event: React.MouseEvent<HTMLElement>) => void
			}>
			const originalOnClick = triggerElement.props.onClick as
				| ((event: React.MouseEvent<HTMLElement>) => void)
				| undefined

			return React.cloneElement(triggerElement, {
				onClick: (event: React.MouseEvent<HTMLElement>) => {
					originalOnClick?.(event)
					if (!event.defaultPrevented) {
						setOpen(!open, { reason: 'triggerPress' })
					}
				}
			})
		},
		DropdownMenuContent: ({
			children,
			className,
			onClick,
			onKeyDown
		}: {
			children: ReactNode
			className?: string
			onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
			onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void
		}) => {
			const { open, setOpen } = React.useContext(MenuContext)
			if (!open) return null

			return (
				<div
					className={className}
					data-testid='dropdown-menu-content'
					onClick={onClick}
					onKeyDown={onKeyDown}
				>
					<button
						data-testid='dismiss-menu-focus-out'
						onClick={() => setOpen(false, { reason: 'focus-out' })}
						type='button'
					/>
					<button
						data-testid='dismiss-menu-sibling-open'
						onClick={() => setOpen(false, { reason: 'sibling-open' })}
						type='button'
					/>
					<button
						data-testid='dismiss-menu-outside-press'
						onClick={() => setOpen(false, { reason: 'outside-press' })}
						type='button'
					/>
					{children}
				</div>
			)
		},
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
			<button
				disabled={disabled}
				onClick={() => onClick?.()}
				title={title}
				type='button'
			>
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
	}
})

vi.mock('~/features/reviews/api/createReview', () => ({
	useCreateReview: () => ({
		mutateAsync: createReviewMock,
		isPending: false
	})
}))

vi.mock('./ReviewItem', () => ({
	ReviewItem: ({
		entry,
		onDeferredInvalidation,
		onNestedOverlayOpenChange,
		onNestedOverlayTriggerInteract,
		onReviewClick
	}: {
		entry: {
			id: number
			description?: string | null
			effective_date?: string | null
		}
		onDeferredInvalidation?: () => void
		onNestedOverlayOpenChange?: (open: boolean) => void
		onNestedOverlayTriggerInteract?: () => void
		onReviewClick?: (reviewId: number) => void
	}) =>
		onReviewClick ? (
			<div>
				<button
					data-testid={`review-item-${entry.id}`}
					onClick={() => onReviewClick(entry.id)}
					type='button'
				>
					{entry.description?.trim() || 'No description'}
					{entry.effective_date ? ` ${entry.effective_date}` : ''}
				</button>
				<button
					data-testid={`review-item-mark-deferred-${entry.id}`}
					onClick={() => onDeferredInvalidation?.()}
					type='button'
				>
					Mark deferred invalidation
				</button>
				<button
					data-testid={`review-item-open-nested-${entry.id}`}
					onClick={() => {
						onNestedOverlayTriggerInteract?.()
						onNestedOverlayOpenChange?.(true)
					}}
					type='button'
				>
					Open nested overlay
				</button>
				<button
					data-testid={`review-item-close-nested-${entry.id}`}
					onClick={() => onNestedOverlayOpenChange?.(false)}
					type='button'
				>
					Close nested overlay
				</button>
			</div>
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
		invalidateQueriesMock.mockReset()
		createReviewMock.mockReset()
		openReviewDialogMock.mockReset()
		invalidateQueriesMock.mockResolvedValue(undefined)

		useQueryMock.mockReturnValue({
			isFetching: false,
			isLoading: false,
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

	it('renders add, due reviews, last reviewed, and the unscheduled count badge', async () => {
		const user = userEvent.setup()

		render(<ReviewsMenu reviewCardId={12} />)

		const trigger = screen.getByRole('button', { name: /Reviews/i })
		expect(useQueryMock).toHaveBeenLastCalledWith(
			expect.objectContaining({ enabled: false })
		)

		await user.click(trigger)

		const content = screen.getByTestId('dropdown-menu-content')
		expect(trigger).toBeInTheDocument()
		expect(useQueryMock).toHaveBeenLastCalledWith(
			expect.objectContaining({ enabled: true })
		)
		expect(content).toHaveClass('w-[18rem]')
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
		const trigger = screen.getByRole('button', { name: /Reviews/i })

		await user.click(trigger)
		await user.click(screen.getByRole('button', { name: /Catch-up prompt/i }))
		expect(openReviewDialogMock).toHaveBeenCalledWith(101)
		expect(
			screen.queryByTestId('dropdown-menu-content')
		).not.toBeInTheDocument()

		await user.click(trigger)
		await user.click(screen.getByRole('button', { name: /Strong recall/i }))
		expect(openReviewDialogMock).toHaveBeenCalledWith(103)
		expect(
			screen.queryByTestId('dropdown-menu-content')
		).not.toBeInTheDocument()

		await user.click(trigger)
		await user.click(screen.getByRole('button', { name: /Good/i }))
		expect(createReviewMock).toHaveBeenCalledWith({
			review_card_id: 12,
			rating: 'good',
			description: '',
			scheduled_at: null,
			completed_at: '2026-03-19'
		})
		expect(
			screen.queryByTestId('dropdown-menu-content')
		).not.toBeInTheDocument()

		await user.click(trigger)
		await user.click(screen.getByRole('button', { name: /See all/i }))
		expect(onSeeAll).toHaveBeenCalled()
		expect(
			screen.queryByTestId('dropdown-menu-content')
		).not.toBeInTheDocument()
	})

	it('flushes deferred structural invalidations when opening a review dialog', async () => {
		const user = userEvent.setup()

		render(<ReviewsMenu reviewCardId={12} />)

		await user.click(screen.getByRole('button', { name: /Reviews/i }))
		await user.click(screen.getByTestId('review-item-mark-deferred-101'))
		await user.click(screen.getByRole('button', { name: /Catch-up prompt/i }))

		expect(openReviewDialogMock).toHaveBeenCalledWith(101)
		expect(invalidateQueriesMock.mock.calls).toEqual(
			expect.arrayContaining([
				[{ queryKey: ['review-cards'] }],
				[{ queryKey: ['review-queue'] }],
				[{ queryKey: ['search'] }]
			])
		)
		expect(
			screen.queryByTestId('dropdown-menu-content')
		).not.toBeInTheDocument()
	})

	it('omits the see-all badge when there are no unscheduled uncompleted reviews', async () => {
		const user = userEvent.setup()

		useQueryMock.mockReturnValue({
			isFetching: false,
			isLoading: false,
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
		await user.click(trigger)

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

	it('uses the compact dropdown width when there are no due reviews or last reviewed entry', async () => {
		const user = userEvent.setup()

		useQueryMock.mockReturnValue({
			isFetching: false,
			isLoading: false,
			data: [
				{
					id: 301,
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

		render(<ReviewsMenu reviewCardId={12} />)

		await user.click(screen.getByRole('button', { name: /Reviews/i }))

		const content = screen.getByTestId('dropdown-menu-content')

		expect(screen.queryByText('Due')).not.toBeInTheDocument()
		expect(screen.queryByText('Last reviewed')).not.toBeInTheDocument()
		expect(content).not.toHaveClass('w-[18rem]')
	})

	it('renders trigger badges from explicit trigger counts before reviews are loaded', () => {
		useQueryMock.mockReturnValue({
			isFetching: false,
			isLoading: false,
			data: undefined
		})

		render(
			<ReviewsMenu
				reviewCardId={12}
				triggerCounts={{
					unscheduledCount: 4,
					overdueCount: 2,
					dueTodayCount: 1
				}}
			/>
		)

		const trigger = screen.getByRole('button', { name: /Reviews/i })

		expect(
			within(trigger).getByTestId('reviews-trigger-unscheduled-count')
		).toHaveTextContent('4')
		expect(
			within(trigger).getByTestId('reviews-trigger-overdue-count')
		).toHaveTextContent('2')
		expect(
			within(trigger).getByTestId('reviews-trigger-due-today-count')
		).toHaveTextContent('1')
		expect(useQueryMock).toHaveBeenLastCalledWith(
			expect.objectContaining({ enabled: false })
		)
	})

	it('keeps trigger badges on stable fallback counts while cached reviews are idle', () => {
		useQueryMock.mockReturnValue({
			isFetching: false,
			isLoading: false,
			data: [
				{
					id: 301,
					review_card_id: 12,
					rating: null,
					description: 'Stale cached draft',
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

		render(
			<ReviewsMenu
				reviewCardId={12}
				triggerCounts={{
					unscheduledCount: 4,
					overdueCount: 2,
					dueTodayCount: 1
				}}
			/>
		)

		const trigger = screen.getByRole('button', { name: /Reviews/i })

		expect(
			within(trigger).getByTestId('reviews-trigger-unscheduled-count')
		).toHaveTextContent('4')
		expect(
			within(trigger).getByTestId('reviews-trigger-overdue-count')
		).toHaveTextContent('2')
		expect(
			within(trigger).getByTestId('reviews-trigger-due-today-count')
		).toHaveTextContent('1')
	})

	it('prefers live review data over fallback trigger counts when reviews are provided', () => {
		useQueryMock.mockReturnValue({
			isFetching: false,
			isLoading: false,
			data: []
		})

		render(
			<ReviewsMenu
				reviewCardId={12}
				reviews={[
					{
						id: 201,
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
				]}
				triggerCounts={{
					unscheduledCount: 4,
					overdueCount: 2,
					dueTodayCount: 1
				}}
			/>
		)

		const trigger = screen.getByRole('button', { name: /Reviews/i })

		expect(
			within(trigger).getByTestId('reviews-trigger-unscheduled-count')
		).toHaveTextContent('1')
		expect(
			within(trigger).queryByTestId('reviews-trigger-overdue-count')
		).not.toBeInTheDocument()
		expect(
			within(trigger).queryByTestId('reviews-trigger-due-today-count')
		).not.toBeInTheDocument()
	})

	it('shows loading placeholders and stable counts while stale cached rows refetch', async () => {
		const user = userEvent.setup()

		useQueryMock.mockReturnValue({
			data: [
				{
					id: 101,
					review_card_id: 12,
					rating: null,
					description: 'Stale catch-up prompt',
					notes: '',
					scheduled_at: '2026-03-18',
					completed_at: null,
					effective_date: '2026-03-18',
					inserted_at: '2026-03-15T12:00:00.000Z',
					updated_at: '2026-03-15T12:00:00.000Z',
					review_card: {
						id: 12,
						topic_id: 7,
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
			],
			isFetching: true,
			isLoading: false
		})

		render(
			<ReviewsMenu
				hasLastReviewed={true}
				reviewCardId={12}
				triggerCounts={{
					unscheduledCount: 4,
					overdueCount: 2,
					dueTodayCount: 1
				}}
			/>
		)

		const trigger = screen.getByRole('button', { name: /Reviews/i })

		await user.click(trigger)

		const content = screen.getByTestId('dropdown-menu-content')

		expect(content).toHaveClass('w-[18rem]')
		expect(screen.queryByText('Due')).not.toBeInTheDocument()
		expect(screen.queryByText('Last reviewed')).not.toBeInTheDocument()
		expect(screen.queryByText('Stale catch-up prompt')).not.toBeInTheDocument()
		expect(content.querySelectorAll('[aria-busy="true"]')).toHaveLength(1)
		const seeAllButton = screen.getByRole('button', { name: /See all/i })
		expect(seeAllButton).toBeInTheDocument()
		expect(within(seeAllButton).getByText('4')).toBeInTheDocument()
		expect(
			within(trigger).getByTestId('reviews-trigger-unscheduled-count')
		).toHaveTextContent('4')
		expect(
			within(trigger).getByTestId('reviews-trigger-overdue-count')
		).toHaveTextContent('2')
		expect(
			within(trigger).getByTestId('reviews-trigger-due-today-count')
		).toHaveTextContent('1')
	})

	it('stops nested review clicks from bubbling to parent shells', async () => {
		const user = userEvent.setup()
		const onShellClick = vi.fn()

		render(
			<div onClick={onShellClick}>
				<ReviewsMenu reviewCardId={12} />
			</div>
		)

		await user.click(screen.getByRole('button', { name: /Reviews/i }))
		onShellClick.mockReset()
		await user.click(screen.getByRole('button', { name: /Catch-up prompt/i }))

		expect(openReviewDialogMock).toHaveBeenCalledWith(101)
		expect(onShellClick).not.toHaveBeenCalled()
	})

	it('keeps the parent menu open while nested review controls are used', async () => {
		const user = userEvent.setup()

		render(<ReviewsMenu reviewCardId={12} />)

		await user.click(screen.getByRole('button', { name: /Reviews/i }))
		await user.click(screen.getByTestId('review-item-open-nested-101'))
		await user.click(screen.getByTestId('dismiss-menu-focus-out'))

		expect(screen.getByTestId('dropdown-menu-content')).toBeInTheDocument()

		await user.click(screen.getByTestId('dismiss-menu-sibling-open'))

		expect(screen.getByTestId('dropdown-menu-content')).toBeInTheDocument()

		await user.click(screen.getByTestId('review-item-close-nested-101'))

		expect(screen.getByTestId('dropdown-menu-content')).toBeInTheDocument()
	})

	it('dismisses the parent menu on a real outside press while a nested overlay is open', async () => {
		const user = userEvent.setup()

		render(<ReviewsMenu reviewCardId={12} />)

		await user.click(screen.getByRole('button', { name: /Reviews/i }))
		await user.click(screen.getByTestId('review-item-open-nested-101'))
		await user.click(screen.getByTestId('dismiss-menu-outside-press'))

		expect(
			screen.queryByTestId('dropdown-menu-content')
		).not.toBeInTheDocument()
	})
})
