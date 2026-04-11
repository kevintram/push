import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
	createTopicAsyncMock,
	navigateMock,
	parentTopic,
	reviewCard,
	reviewsMenuPropsMock,
	updateReviewCardAsyncMock,
	useReviewCardMock
} from '~/testing/support/detailPageTestSupport'
import { ReviewCardDetailPage } from '../ReviewCardDetailPage'

describe('ReviewCardDetailPage', () => {
	it('keeps the review-card topic pill navigable and reassigns through search', async () => {
		const user = userEvent.setup()
		updateReviewCardAsyncMock.mockResolvedValue(undefined)

		render(<ReviewCardDetailPage reviewCardId={11} />)

		await user.click(
			screen.getByRole('button', { name: reviewCard.topic_title })
		)

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '1' }
		})
		expect(
			screen.getByRole('button', { name: /Change topic/iu })
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: /^Search$/iu }))
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
			screen.queryByRole('button', { name: /Remove topic/iu })
		).not.toBeInTheDocument()
	})

	it('passes stable trigger counts to the detail-page reviews menu', () => {
		render(<ReviewCardDetailPage reviewCardId={11} />)

		expect(reviewsMenuPropsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				hasLastReviewed: false,
				reviewCardId: 11,
				triggerCounts: {
					pendingCount: 2,
					overdueCount: 1,
					dueTodayCount: 3
				}
			})
		)
	})

	it('creates and assigns a new topic from ReviewCardDetail', async () => {
		const user = userEvent.setup()
		createTopicAsyncMock.mockResolvedValue({ id: 4 })
		updateReviewCardAsyncMock.mockResolvedValue(undefined)

		render(<ReviewCardDetailPage reviewCardId={11} />)

		await user.click(screen.getByRole('button', { name: /Change topic/iu }))
		await user.click(screen.getByRole('button', { name: /^Create$/iu }))

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

	it('focuses the primary text field when landing on a newly created review card', async () => {
		window.sessionStorage.setItem(
			'review-cards:focus-new-review-card-primary-text',
			'11'
		)

		render(<ReviewCardDetailPage reviewCardId={11} />)

		await waitFor(() => {
			expect(screen.getByDisplayValue(reviewCard.primary_text)).toHaveFocus()
		})
		expect(
			window.sessionStorage.getItem(
				'review-cards:focus-new-review-card-primary-text'
			)
		).toBeNull()
	})

	it('syncs review-card fields on first load and only refreshes untouched fields on refetch', async () => {
		const user = userEvent.setup()
		let currentReviewCard = { ...reviewCard }

		useReviewCardMock.mockImplementation(() => ({
			data: currentReviewCard,
			isLoading: false,
			error: null
		}))

		const { rerender } = render(<ReviewCardDetailPage reviewCardId={11} />)

		await waitFor(() => {
			expect(
				screen.getByDisplayValue(reviewCard.primary_text)
			).toBeInTheDocument()
			expect(
				screen.getByDisplayValue(reviewCard.secondary_text)
			).toBeInTheDocument()
		})

		const promptField = screen.getByDisplayValue(reviewCard.primary_text)
		await user.clear(promptField)
		await user.type(promptField, 'Solve for y')

		currentReviewCard = {
			...currentReviewCard,
			primary_text: 'Solve for z',
			secondary_text: 'Updated answer from server'
		}

		rerender(<ReviewCardDetailPage reviewCardId={11} />)

		await waitFor(() => {
			expect(screen.getByDisplayValue('Solve for y')).toBeInTheDocument()
			expect(
				screen.getByDisplayValue('Updated answer from server')
			).toBeInTheDocument()
		})
	})

	it('flags a review card from ReviewCardDetail', async () => {
		const user = userEvent.setup()
		updateReviewCardAsyncMock.mockResolvedValue(undefined)

		render(<ReviewCardDetailPage reviewCardId={11} />)

		await user.click(screen.getByRole('button', { name: /Flag this item/iu }))

		await waitFor(() => {
			expect(updateReviewCardAsyncMock).toHaveBeenCalledWith({
				id: 11,
				flagged: true
			})
		})
	})
})
