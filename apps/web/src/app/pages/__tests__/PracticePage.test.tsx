import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
	buildPracticeQueueItems,
	renderPracticePage,
	reviewCard,
	reviewCardRenderSpy,
	useReviewCardQueueCountsMock,
	useReviewCardQueueMock
} from '~/testing/support/masonryPageTestSupport'

describe('PracticePage', () => {
	it('renders list views through masonry and keeps focused view non-masonry', async () => {
		const user = userEvent.setup()
		useReviewCardQueueMock.mockReturnValue({
			data: [
				{
					queue_type: 'due',
					card: {
						...reviewCard,
						id: 31,
						primary_text: 'Today practice prompt'
					},
					review_id: null,
					scheduled_at: '2026-03-05',
					action_days: 0,
					days_until_due: 0,
					days_until_hazy: null
				},
				{
					queue_type: 'due',
					card: {
						...reviewCard,
						id: 32,
						primary_text: 'Tomorrow practice prompt'
					},
					review_id: null,
					scheduled_at: '2026-03-06',
					action_days: 1,
					days_until_due: 1,
					days_until_hazy: null
				}
			],
			isLoading: false
		})

		render(renderPracticePage({}))

		expect(screen.getAllByTestId('masonry-layout')).toHaveLength(2)
		expect(screen.getByText('Today')).toBeInTheDocument()
		expect(screen.getByText('Tomorrow')).toBeInTheDocument()

		await user.click(screen.getByRole('tab', { name: 'Focused' }))

		expect(screen.queryByTestId('masonry-layout')).not.toBeInTheDocument()
		expect(screen.getByText('Today practice prompt')).toBeInTheDocument()
		expect(
			reviewCardRenderSpy.mock.calls.some(([props]) => {
				if (props.reviewCard.primary_text !== 'Today practice prompt')
					return false
				return !('enableLargeCardMode' in props && props.enableLargeCardMode)
			})
		).toBe(true)
		expect(screen.getByTestId('focused-practice-layout')).toBeInTheDocument()
		expect(screen.queryByText('Focused Queue')).not.toBeInTheDocument()
		expect(screen.queryByText('Keep this set warm')).not.toBeInTheDocument()
		expect(screen.queryByText('card in focus')).not.toBeInTheDocument()
		expect(screen.queryByText('cards in focus')).not.toBeInTheDocument()
	})

	it('renders tab counts and due header summary', () => {
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
								primary_text: `New practice ${index + 1}`
							},
							review_id: null,
							scheduled_at: null,
							action_days: null,
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
							card: {
								...reviewCard,
								id: 81,
								primary_text: 'Overdue practice A'
							},
							review_id: null,
							scheduled_at: '2026-03-03',
							action_days: -2,
							days_until_due: -2,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: {
								...reviewCard,
								id: 82,
								primary_text: 'Overdue practice B'
							},
							review_id: null,
							scheduled_at: '2026-03-04',
							action_days: -1,
							days_until_due: -1,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 83, primary_text: 'Today practice A' },
							review_id: null,
							scheduled_at: '2026-03-05',
							action_days: 0,
							days_until_due: 0,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 84, primary_text: 'Today practice B' },
							review_id: null,
							scheduled_at: '2026-03-05',
							action_days: 0,
							days_until_due: 0,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 85, primary_text: 'Today practice C' },
							review_id: null,
							scheduled_at: '2026-03-05',
							action_days: 0,
							days_until_due: 0,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 86, primary_text: 'Soon practice A' },
							review_id: null,
							scheduled_at: '2026-03-06',
							action_days: 1,
							days_until_due: 1,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 87, primary_text: 'Soon practice B' },
							review_id: null,
							scheduled_at: '2026-03-07',
							action_days: 2,
							days_until_due: 2,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 88, primary_text: 'Soon practice C' },
							review_id: null,
							scheduled_at: '2026-03-08',
							action_days: 3,
							days_until_due: 3,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 89, primary_text: 'Soon practice D' },
							review_id: null,
							scheduled_at: '2026-03-09',
							action_days: 4,
							days_until_due: 4,
							days_until_hazy: null
						},
						{
							queue_type: 'due' as const,
							card: { ...reviewCard, id: 90, primary_text: 'Soon practice E' },
							review_id: null,
							scheduled_at: '2026-03-10',
							action_days: 5,
							days_until_due: 5,
							days_until_hazy: null
						}
					],
					isLoading: false
				}
			}
		)

		render(renderPracticePage({ initialScope: 'all' }))

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
	])('renders focused layout rows for $count cards', ({
		count,
		expectedRows
	}) => {
		useReviewCardQueueMock.mockReturnValue({
			data: buildPracticeQueueItems(count),
			isLoading: false
		})

		render(renderPracticePage({ initialScope: 'focused' }))

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
	})

	it('renders five focused practice cards as 2/2/1 below xl', async () => {
		window.happyDOM?.setViewport({ height: 1100, width: 900 })
		useReviewCardQueueMock.mockReturnValue({
			data: buildPracticeQueueItems(5),
			isLoading: false
		})

		render(renderPracticePage({ initialScope: 'focused' }))

		await waitFor(() => {
			const rows = screen.getAllByTestId('focused-practice-row')
			expect(rows.map(row => row.getAttribute('data-row-size'))).toEqual([
				'2',
				'2',
				'1'
			])
		})
	})

	it('renders five focused practice cards as 3/2 at xl and above', async () => {
		window.happyDOM?.setViewport({ height: 1200, width: 1440 })
		useReviewCardQueueMock.mockReturnValue({
			data: buildPracticeQueueItems(5),
			isLoading: false
		})

		render(renderPracticePage({ initialScope: 'focused' }))

		await waitFor(() => {
			const rows = screen.getAllByTestId('focused-practice-row')
			expect(rows.map(row => row.getAttribute('data-row-size'))).toEqual([
				'3',
				'2'
			])
		})
	})

	it('renders the due scope controls inline above focused practice content', () => {
		useReviewCardQueueMock.mockReturnValue({
			data: buildPracticeQueueItems(2),
			isLoading: false
		})

		render(renderPracticePage({ initialScope: 'focused' }))

		const scopeBar = screen.getByTestId('review-queue-scope-bar')
		const focusedLayout = screen.getByTestId('focused-practice-layout')

		expect(scopeBar.closest('.sticky')).toBeNull()
		expect(scopeBar).toContainElement(
			screen.getByRole('tab', { name: 'Focused' })
		)
		expect(scopeBar).toContainElement(screen.getByText('Due in next 7d'))
		// biome-ignore lint/suspicious/noBitwiseOperators: compareDocumentPosition returns a bitmask
		expect(
			scopeBar.compareDocumentPosition(focusedLayout) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy()
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
						id: 51,
						primary_text: 'Today practice',
						inserted_at: '2026-03-05T12:00:00.000Z'
					},
					review_id: null,
					scheduled_at: null,
					action_days: null,
					days_until_due: null
				},
				{
					queue_type: 'new',
					card: {
						...reviewCard,
						id: 52,
						primary_text: 'Earlier this week practice',
						inserted_at: '2026-03-03T12:00:00.000Z'
					},
					review_id: null,
					scheduled_at: null,
					action_days: null,
					days_until_due: null
				},
				{
					queue_type: 'new',
					card: {
						...reviewCard,
						id: 53,
						primary_text: 'Last week practice',
						inserted_at: '2026-02-26T12:00:00.000Z'
					},
					review_id: null,
					scheduled_at: null,
					action_days: null,
					days_until_due: null
				}
			],
			isLoading: false
		})

		try {
			render(renderPracticePage({ initialTab: 'new' }))

			expect(
				screen.queryByRole('tab', { name: 'Focused' })
			).not.toBeInTheDocument()
			expect(screen.queryByRole('tab', { name: 'All' })).not.toBeInTheDocument()
			expect(screen.getAllByText(/^Today/u)).toHaveLength(2)
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
