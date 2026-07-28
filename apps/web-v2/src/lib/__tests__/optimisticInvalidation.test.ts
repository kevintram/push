import { type Query, QueryClient, type QueryKey } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { optimisticMutationKeys } from '../mutationConfig'
import {
	excludeDeletedFromOptimisticBatch,
	invalidateAfterOptimisticBatch,
} from '../optimisticInvalidation'

function tick() {
	return new Promise(resolve => setTimeout(resolve, 0))
}

function spyOnInvalidate(client: QueryClient) {
	return vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined)
}

type InvalidateSpy = ReturnType<typeof spyOnInvalidate>

function invalidatedKeys(invalidate: InvalidateSpy) {
	return invalidate.mock.calls.map(([filters]) => filters?.queryKey)
}

describe('invalidateAfterOptimisticBatch', () => {
	it('invalidates once the last mutation has settled', async () => {
		const client = new QueryClient()
		vi.spyOn(client, 'isMutating').mockReturnValue(0)
		const invalidate = spyOnInvalidate(client)

		invalidateAfterOptimisticBatch(client, [['topics']])
		expect(invalidate).not.toHaveBeenCalled()

		await tick()

		expect(client.isMutating).toHaveBeenCalledWith({
			mutationKey: optimisticMutationKeys.all,
		})
		expect(invalidatedKeys(invalidate)).toEqual([['topics']])
	})

	it('waits for in-flight mutations and flushes the union of roots', async () => {
		const client = new QueryClient()
		const isMutating = vi.spyOn(client, 'isMutating').mockReturnValue(1)
		const invalidate = spyOnInvalidate(client)

		invalidateAfterOptimisticBatch(client, [['topics'], ['review-cards']])
		await tick()
		expect(invalidate).not.toHaveBeenCalled()

		isMutating.mockReturnValue(0)
		invalidateAfterOptimisticBatch(client, [['review-cards'], ['reviews']])
		await tick()

		expect(invalidatedKeys(invalidate)).toEqual([
			['topics'],
			['review-cards'],
			['reviews'],
		])
	})

	it('flushes roots queued while an earlier flush was still running', async () => {
		// Regression: the flusher used to clear the queue and then await its own
		// refetches while query-core still counted it as pending, so anything
		// queued during that window was never invalidated by anyone.
		const client = new QueryClient()
		const isMutating = vi.spyOn(client, 'isMutating').mockReturnValue(0)
		let resolveFirst: () => void = () => {}
		const invalidate = vi
			.spyOn(client, 'invalidateQueries')
			.mockImplementationOnce(
				() => new Promise<void>(resolve => (resolveFirst = resolve)),
			)
			.mockResolvedValue(undefined)

		invalidateAfterOptimisticBatch(client, [['topics']])
		await tick()
		expect(invalidatedKeys(invalidate)).toEqual([['topics']])

		// A second mutation runs and settles while the first refetch is pending.
		isMutating.mockReturnValue(1)
		invalidateAfterOptimisticBatch(client, [['reviews']])
		await tick()
		isMutating.mockReturnValue(0)
		invalidateAfterOptimisticBatch(client, [['reviews']])
		await tick()

		expect(invalidatedKeys(invalidate)).toEqual([['topics'], ['reviews']])
		resolveFirst()
	})

	it('coalesces mutations that settle in the same tick', async () => {
		const client = new QueryClient()
		// Both mutations observe themselves plus the other as still pending,
		// because neither has dispatched yet when `onSettled` runs.
		const isMutating = vi.spyOn(client, 'isMutating').mockReturnValue(2)
		const invalidate = spyOnInvalidate(client)

		invalidateAfterOptimisticBatch(client, [['topics']])
		invalidateAfterOptimisticBatch(client, [['reviews']])
		isMutating.mockReturnValue(0)
		await tick()

		expect(invalidatedKeys(invalidate)).toEqual([['topics'], ['reviews']])
	})

	it('keeps pending roots isolated between clients', async () => {
		const first = new QueryClient()
		const second = new QueryClient()
		const firstIsMutating = vi.spyOn(first, 'isMutating').mockReturnValue(1)
		vi.spyOn(second, 'isMutating').mockReturnValue(0)
		const firstInvalidate = spyOnInvalidate(first)
		const secondInvalidate = spyOnInvalidate(second)

		invalidateAfterOptimisticBatch(first, [['topics']])
		invalidateAfterOptimisticBatch(second, [['reviews']])
		await tick()

		expect(invalidatedKeys(secondInvalidate)).toEqual([['reviews']])
		expect(firstInvalidate).not.toHaveBeenCalled()

		firstIsMutating.mockReturnValue(0)
		invalidateAfterOptimisticBatch(first, [['review-cards']])
		await tick()

		expect(invalidatedKeys(firstInvalidate)).toEqual([
			['topics'],
			['review-cards'],
		])
	})
})

describe('excludeDeletedFromOptimisticBatch', () => {
	function matches(invalidate: InvalidateSpy, key: QueryKey) {
		const predicate = invalidate.mock.calls[0]?.[0]?.predicate
		return predicate?.({ queryKey: key } as Query) ?? false
	}

	it('skips queries for records the batch deleted', async () => {
		const client = new QueryClient()
		vi.spyOn(client, 'isMutating').mockReturnValue(0)
		const invalidate = spyOnInvalidate(client)

		excludeDeletedFromOptimisticBatch(client, [
			['review-cards', 'detail', '7'],
			['reviews', 'list', { reviewCardId: '7' }],
		])
		invalidateAfterOptimisticBatch(client, [['review-cards']])
		await tick()

		expect(matches(invalidate, ['review-cards', 'list', undefined])).toBe(
			true,
		)
		expect(matches(invalidate, ['review-cards', 'detail', '7'])).toBe(false)
		expect(matches(invalidate, ['review-cards', 'detail', '8'])).toBe(true)
		// `forCard` is a partial key: it must match the full filter object.
		expect(
			matches(invalidate, [
				'reviews',
				'list',
				{ reviewCardId: '7', order: 'desc' },
			]),
		).toBe(false)
	})

	it('stops excluding deleted keys after the batch flushes', async () => {
		const client = new QueryClient()
		vi.spyOn(client, 'isMutating').mockReturnValue(0)
		const first = spyOnInvalidate(client)

		excludeDeletedFromOptimisticBatch(client, [['topics', 'detail', '3']])
		invalidateAfterOptimisticBatch(client, [['topics']])
		await tick()
		expect(matches(first, ['topics', 'detail', '3'])).toBe(false)

		first.mockClear()
		invalidateAfterOptimisticBatch(client, [['topics']])
		await tick()
		expect(matches(first, ['topics', 'detail', '3'])).toBe(true)
	})
})
