import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
	renderReviewPage,
	reviewCard,
	useReviewCardQueueCountsMock,
	useReviewCardQueueMock
} from '~/testing/support/masonryPageTestSupport'

describe('ReviewPage', () => {
	it('requests the unified queues and renders new, overdue, and due sections together', () => {
		useReviewCardQueueCountsMock.mockReturnValue({
			overdueCount: 1,
			dueTodayCount: 1,
			newCount: 2,
			dueNextSevenDaysCount: 3
		})
		useReviewCardQueueMock.mockImplementation(
			(params: { filter?: string; tab?: string }) => {
				if (params.filter !== 'all') {
					return { data: { items: [], as_of: '2026-03-05' }, isLoading: false }
				}

				if (params.tab === 'new') {
					return {
						data: {
							items: [
								{
									queue_type: 'new' as const,
									card: {
										...reviewCard,
										id: 51,
										primary_text: 'New practice',
										type: 'practice'
									},
									review_id: null,
									scheduled_at: null,
									action_days: null,
									days_until_due: null,
									days_until_hazy: null
								},
								{
									queue_type: 'new' as const,
									card: {
										...reviewCard,
										id: 52,
										primary_text: 'New flashcard',
										type: 'flashcard'
									},
									review_id: null,
									scheduled_at: null,
									action_days: null,
									days_until_due: null,
									days_until_hazy: null
								}
							],
							as_of: '2026-03-05'
						},
						isLoading: false
					}
				}

				return {
					data: {
						items: [
							{
								queue_type: 'due' as const,
								card: {
									...reviewCard,
									id: 61,
									primary_text: 'Overdue practice',
									type: 'practice'
								},
								review_id: null,
								scheduled_at: '2026-03-04',
								action_days: -1,
								days_until_due: -1,
								days_until_hazy: null
							},
							{
								queue_type: 'due' as const,
								card: {
									...reviewCard,
									id: 62,
									primary_text: 'Today flashcard',
									type: 'flashcard'
								},
								review_id: null,
								scheduled_at: '2026-03-05',
								action_days: 0,
								days_until_due: 0,
								days_until_hazy: null
							}
						],
						as_of: '2026-03-05'
					},
					isLoading: false
				}
			}
		)

		render(renderReviewPage({ initialFilter: 'all' }))

		expect(useReviewCardQueueCountsMock).toHaveBeenCalledWith({ filter: 'all' })
		expect(useReviewCardQueueMock).toHaveBeenCalledWith({
			filter: 'all',
			tab: 'new'
		})
		expect(useReviewCardQueueMock).toHaveBeenCalledWith({
			filter: 'all',
			tab: 'due',
			focused: false
		})
		expect(
			screen.getByRole('heading', { name: /Reviews/iu })
		).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: /New/iu })).toBeInTheDocument()
		expect(
			screen.getByRole('heading', { name: /Overdue/iu })
		).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: /Today/iu })).toBeInTheDocument()
		expect(screen.getByText('New practice')).toBeInTheDocument()
		expect(screen.getByText('New flashcard')).toBeInTheDocument()
		expect(screen.getByText('Overdue practice')).toBeInTheDocument()
		expect(screen.getByText('Today flashcard')).toBeInTheDocument()
	})

	it('switches filters and requests the filtered queue', async () => {
		const user = userEvent.setup()
		useReviewCardQueueMock.mockReturnValue({
			data: { items: [], as_of: '2026-03-05' },
			isLoading: false
		})

		render(renderReviewPage({ initialFilter: 'all' }))

		await user.click(screen.getByRole('tab', { name: 'Practice' }))

		await waitFor(() => {
			expect(useReviewCardQueueCountsMock).toHaveBeenCalledWith({
				filter: 'practice'
			})
		})
		expect(useReviewCardQueueMock).toHaveBeenCalledWith({
			filter: 'practice',
			tab: 'new'
		})
		expect(useReviewCardQueueMock).toHaveBeenCalledWith({
			filter: 'practice',
			tab: 'due',
			focused: false
		})
	})
})
