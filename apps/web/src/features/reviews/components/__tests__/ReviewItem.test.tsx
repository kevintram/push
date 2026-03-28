import { useQueryClient } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReviewListItem } from '../../types/review.types'
import { ReviewItem } from '../ReviewItem'

const prefetchQueryMock = vi.fn()
const getQueryDataMock = vi.fn()
const setQueryDataMock = vi.fn()

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQueryClient: vi.fn()
	}
})

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => vi.fn()
}))

vi.mock('../../api/updateReview', () => ({
	useUpdateReview: () => ({
		isPending: false,
		mutateAsync: vi.fn()
	})
}))

vi.mock('../../api/deleteReview', () => ({
	useDeleteReview: () => ({
		mutateAsync: vi.fn()
	})
}))

const entry: ReviewListItem = {
	id: 7,
	review_card_id: 11,
	rating: null,
	description: 'Review item',
	notes: '',
	scheduled_at: null,
	completed_at: null,
	effective_date: null,
	inserted_at: '2026-03-12T00:00:00Z',
	updated_at: '2026-03-12T00:00:00Z',
	review_card: {
		id: 11,
		topic_id: 5,
		type: 'flashcard',
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

describe('ReviewItem', () => {
	beforeEach(() => {
		prefetchQueryMock.mockReset()
		getQueryDataMock.mockReset()
		setQueryDataMock.mockReset()
		prefetchQueryMock.mockResolvedValue(undefined)
		vi.mocked(useQueryClient).mockReturnValue({
			prefetchQuery: prefetchQueryMock,
			getQueryData: getQueryDataMock,
			setQueryData: setQueryDataMock
		} as never)
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('opens only one date picker popover when a date trigger is clicked', async () => {
		const user = userEvent.setup()

		render(<ReviewItem entry={entry} />)

		const dateButtons = screen.getAllByRole('button', { name: /no date/iu })
		expect(dateButtons).toHaveLength(2)

		const dateButton = dateButtons[0]!
		await user.click(dateButton)

		expect(
			await screen.findAllByRole('button', { name: 'Clear' })
		).toHaveLength(1)
	})

	it('seeds detail cache and opens the review dialog when clicked', async () => {
		const user = userEvent.setup()
		const onReviewClick = vi.fn()

		render(<ReviewItem entry={entry} onReviewClick={onReviewClick} />)

		await user.click(screen.getAllByText('Review item')[0]!)

		expect(setQueryDataMock).toHaveBeenCalledWith(['reviews', 7], entry, {
			updatedAt: 0
		})
		expect(onReviewClick).toHaveBeenCalledWith(7)
	})

	it('refreshes existing detail cache entries from the latest row data', async () => {
		const user = userEvent.setup()
		const onReviewClick = vi.fn()

		getQueryDataMock.mockReturnValue({
			...entry,
			description: 'Stale cached review'
		})

		render(<ReviewItem entry={entry} onReviewClick={onReviewClick} />)

		await user.click(screen.getAllByText('Review item')[0]!)

		expect(setQueryDataMock).toHaveBeenCalledWith(['reviews', 7], entry, {
			updatedAt: 0
		})
		expect(onReviewClick).toHaveBeenCalledWith(7)
	})

	it('prefetches review detail after hover intent', () => {
		vi.useFakeTimers()

		render(<ReviewItem entry={entry} />)

		fireEvent.mouseEnter(screen.getAllByText('Review item')[0]!)
		vi.advanceTimersByTime(100)

		expect(setQueryDataMock).toHaveBeenCalledWith(['reviews', 7], entry, {
			updatedAt: 0
		})
		expect(prefetchQueryMock).toHaveBeenCalledTimes(1)
		expect(prefetchQueryMock.mock.calls[0]?.[0]).toMatchObject({
			queryKey: ['reviews', 7],
			staleTime: 30_000
		})
	})

	it('cancels review detail prefetch when hover intent ends early', () => {
		vi.useFakeTimers()

		render(<ReviewItem entry={entry} />)

		const row = screen.getAllByText('Review item')[0]!
		fireEvent.mouseEnter(row)
		fireEvent.mouseLeave(row)
		vi.advanceTimersByTime(100)

		expect(prefetchQueryMock).not.toHaveBeenCalled()
		expect(setQueryDataMock).not.toHaveBeenCalled()
	})

	it('reports more-actions dropdown interactions to parent menu guards', async () => {
		const user = userEvent.setup()
		const onNestedOverlayOpenChange = vi.fn()
		const onNestedOverlayTriggerInteract = vi.fn()

		render(
			<ReviewItem
				entry={entry}
				onNestedOverlayOpenChange={onNestedOverlayOpenChange}
				onNestedOverlayTriggerInteract={onNestedOverlayTriggerInteract}
			/>
		)

		await user.click(screen.getAllByTitle('More options')[0]!)

		expect(onNestedOverlayTriggerInteract).toHaveBeenCalled()
		expect(onNestedOverlayOpenChange).toHaveBeenCalledWith(true)
		expect(await screen.findByText('Delete')).toBeInTheDocument()
	})
})
