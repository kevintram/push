import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Review } from '../../types/review.types'
import { useReviewActions } from '../useReviewActions'

const updateMutate = vi.fn()
const deleteMutate = vi.fn()

vi.mock('../../api/reviewQueries', () => ({
	useUpdateReview: () => ({ mutate: updateMutate }),
	useDeleteReview: () => ({ isPending: false, mutate: deleteMutate }),
}))

const review: Review = {
	_id: 'review-1' as Review['_id'],
	_creationTime: 0,
	cardId: 'card-1' as Review['cardId'],
	date: '2026-08-08',
	description: '',
	notes: '',
	ownerId: 'user-1',
	rating: 'good',
}

describe('useReviewActions', () => {
	it('re-rates without touching the completion day', () => {
		const { result } = renderHook(() => useReviewActions(review))

		act(() => result.current.setRating('easy'))
		expect(updateMutate).toHaveBeenLastCalledWith({
			rating: 'easy',
			reviewId: review._id,
		})
	})

	it('moves the completion day without touching the rating', () => {
		const { result } = renderHook(() => useReviewActions(review))

		act(() => result.current.setDate('2026-08-07'))
		expect(updateMutate).toHaveBeenLastCalledWith({
			date: '2026-08-07',
			reviewId: review._id,
		})
	})
})
