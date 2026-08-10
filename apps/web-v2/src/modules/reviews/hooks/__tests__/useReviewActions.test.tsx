import { act, renderHook } from '@testing-library/react'
import { DateTime, Settings } from 'luxon'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Review } from '../../types/review.types'
import { useReviewActions } from '../useReviewActions'

const updateMutate = vi.fn()
const deleteMutate = vi.fn()

vi.mock('../../api/reviewQueries', () => ({
	useUpdateReview: () => ({ mutate: updateMutate }),
	useDeleteReview: () => ({ isPending: false, mutate: deleteMutate }),
}))

const baseReview: Review = {
	_id: 'review-1' as Review['_id'],
	_creationTime: 0,
	description: '',
	notes: '',
	ownerId: 'user-1',
	reviewCardId: 'review-card-1' as Review['reviewCardId'],
}

describe('useReviewActions', () => {
	const originalZone = Settings.defaultZone

	afterEach(() => {
		Settings.defaultZone = originalZone
		vi.useRealTimers()
	})

	it('submits a date with every non-null rating', () => {
		vi.useFakeTimers()
		vi.setSystemTime(DateTime.fromISO('2026-08-09T01:00:00Z').toJSDate())
		Settings.defaultZone = 'America/Los_Angeles'

		const { result, rerender } = renderHook(
			({ review }: { review: Review }) => useReviewActions(review),
			{ initialProps: { review: baseReview } },
		)

		act(() => result.current.setRating('good'))
		expect(updateMutate).toHaveBeenLastCalledWith(
			{
				date: '2026-08-08',
				rating: 'good',
				reviewId: baseReview._id,
			},
			expect.anything(),
		)

		rerender({
			review: { ...baseReview, date: '2026-08-08', rating: 'good' },
		})
		act(() => result.current.setRating('easy'))
		expect(updateMutate).toHaveBeenLastCalledWith(
			{
				date: '2026-08-08',
				rating: 'easy',
				reviewId: baseReview._id,
			},
			expect.anything(),
		)

		act(() => result.current.setRating(null))
		expect(updateMutate).toHaveBeenLastCalledWith(
			{ rating: null, reviewId: baseReview._id },
			expect.anything(),
		)
	})
})
