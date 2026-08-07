import type { Id } from '@convex/_generated/dataModel'
import type { ReviewCard } from '@convex/validators/reviewCards'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '~/testing/createTestQueryClient'

import { useDeleteReviewCard } from '../reviewCardQueries'

const navigate = vi.fn()
const matchRoute = vi.fn()
const removeReviewCard = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => navigate,
	useMatchRoute: () => matchRoute,
}))

vi.mock('@convex-dev/react-query', () => ({
	convexQuery: vi.fn(),
	useConvexMutation: () => removeReviewCard,
}))

const topicId = 'topic-1' as Id<'topics'>
const reviewCardId = 'review-card-1' as Id<'reviewCards'>

const removedReviewCard = {
	_id: reviewCardId,
	topicId,
} satisfies Pick<ReviewCard, '_id' | 'topicId'>

function wrapper({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={createTestQueryClient()}>
			{children}
		</QueryClientProvider>
	)
}

describe('useDeleteReviewCard', () => {
	beforeEach(() => {
		removeReviewCard.mockResolvedValue(removedReviewCard)
	})

	it('falls back to the topic when the open card is deleted', async () => {
		matchRoute.mockReturnValue({ reviewCardId })
		const { result } = renderHook(() => useDeleteReviewCard(), { wrapper })

		await act(async () => {
			result.current.mutate({ reviewCardId })
		})

		await waitFor(() => {
			expect(navigate).toHaveBeenCalledWith({
				to: '/library/$topicId',
				params: { topicId },
			})
		})
	})

	it('stays put when a card other than the open one is deleted', async () => {
		matchRoute.mockReturnValue(false)
		const { result } = renderHook(() => useDeleteReviewCard(), { wrapper })

		await act(async () => {
			result.current.mutate({ reviewCardId })
		})

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true)
		})
		expect(navigate).not.toHaveBeenCalled()
	})
})
