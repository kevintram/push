import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
	navigateMock,
	renderFlashcardsPage,
	reviewCard,
	reviewCardRenderSpy,
	updateReviewCardAsyncMock,
	useReviewCardQueueCountsMock,
	useReviewCardQueueMock
} from './test-support/masonryPageTestSupport'

describe('FlashcardsPage', () => {
	it('renders list views through masonry but keeps focused view non-masonry', async () => {
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

		render(renderFlashcardsPage({}))

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

			render(renderFlashcardsPage({ initialScope: 'all' }))

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

		render(renderFlashcardsPage({}))

		await user.click(screen.getByRole('button', { name: /retire this item/iu }))

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

		render(renderFlashcardsPage({}))

		await user.click(screen.getByRole('button', { name: /retire this item/iu }))

		expect(
			screen.getByRole('alertdialog', {
				name: /this card still has scheduled reviews!/iu
			})
		).toBeInTheDocument()
		expect(updateReviewCardAsyncMock).not.toHaveBeenCalled()

		await user.click(screen.getByRole('button', { name: /^Confirm$/iu }))

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

		render(renderFlashcardsPage({}))

		await user.click(screen.getByRole('button', { name: /retire this item/iu }))
		await user.click(screen.getByRole('button', { name: /^See reviews\.$/iu }))

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

		render(renderFlashcardsPage({}))

		const retireButton = screen.getByRole('button', {
			name: /return this item to review queue/iu
		})

		expect(retireButton).toHaveAttribute('aria-pressed', 'true')
		expect(retireButton).toHaveTextContent('Retire')
		expect(retireButton).not.toHaveTextContent('Restore')
		expect(retireButton.className).toContain('bg-muted')
	})

	it('renders counts from the full due queue while focused mode shows one card', () => {
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

		render(renderFlashcardsPage({}))

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

	it('renders new cards grouped by creation date without due scope tabs', () => {
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
			render(renderFlashcardsPage({ initialTab: 'new' }))

			expect(
				screen.queryByRole('tab', { name: 'Focused' })
			).not.toBeInTheDocument()
			expect(screen.queryByRole('tab', { name: 'All' })).not.toBeInTheDocument()
			expect(screen.getAllByText(/^Today/u)).toHaveLength(2)
			expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
			expect(screen.getByText('Today flashcard')).toBeInTheDocument()
			expect(screen.getByText('Yesterday flashcard')).toBeInTheDocument()
		} finally {
			vi.useRealTimers()
		}
	})
})
