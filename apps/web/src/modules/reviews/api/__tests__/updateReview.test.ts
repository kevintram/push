import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUpdateReview } from '../updateReview'

const invalidateQueriesMock = vi.fn()
let lastMutationOptions:
	| {
			onSuccess?: () => Promise<void>
	  }
	| undefined

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useMutation: (options: unknown) => {
			lastMutationOptions = options as typeof lastMutationOptions
			return options
		},
		useQueryClient: () => ({
			invalidateQueries: invalidateQueriesMock,
		}),
	}
})

function createPendingPromise() {
	let resolve!: () => void
	const promise = new Promise<void>(res => {
		resolve = res
	})
	return { promise, resolve }
}

describe('useUpdateReview', () => {
	beforeEach(() => {
		invalidateQueriesMock.mockReset()
		lastMutationOptions = undefined
	})

	it('marks deferred structural invalidations before reviews invalidation settles', async () => {
		const reviewsInvalidation = createPendingPromise()
		const onDeferredInvalidation = vi.fn()

		invalidateQueriesMock.mockImplementation(
			(input: { queryKey: Array<string>; refetchType?: 'none' }) => {
				if (input.queryKey[0] === 'reviews') {
					return reviewsInvalidation.promise
				}
				return Promise.resolve()
			},
		)

		renderHook(() =>
			useUpdateReview({
				invalidationScope: 'reviews-only',
				onDeferredInvalidation,
			}),
		)

		const onSuccess = lastMutationOptions?.onSuccess
		expect(onSuccess).toBeTypeOf('function')

		const pendingSuccess = onSuccess?.()

		expect(onDeferredInvalidation).toHaveBeenCalledTimes(1)
		expect(invalidateQueriesMock.mock.calls).toEqual(
			expect.arrayContaining([
				[{ queryKey: ['review-cards'], refetchType: 'none' }],
				[{ queryKey: ['reviews'] }],
				[{ queryKey: ['review-queue'], refetchType: 'none' }],
				[{ queryKey: ['search'], refetchType: 'none' }],
			]),
		)

		reviewsInvalidation.resolve()
		await pendingSuccess
	})
})
