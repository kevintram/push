import type { Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '~/testing/createTestQueryClient'

import { useDeleteCard } from '../cardQueries'

const navigate = vi.fn()
const matchRoute = vi.fn()
const removeCard = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => navigate,
	useMatchRoute: () => matchRoute,
}))

vi.mock('@convex-dev/react-query', () => ({
	convexQuery: vi.fn(),
	useConvexMutation: () => removeCard,
}))

const collectionId = 'collection-1' as Id<'collections'>
const cardId = 'card-1' as Id<'cards'>

const removedCard = {
	_id: cardId,
	collectionId,
} satisfies Pick<Card, '_id' | 'collectionId'>

function wrapper({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={createTestQueryClient()}>
			{children}
		</QueryClientProvider>
	)
}

describe('useDeleteCard', () => {
	beforeEach(() => {
		removeCard.mockResolvedValue(removedCard)
	})

	it('falls back to the collection when the open card is deleted', async () => {
		matchRoute.mockReturnValue({ cardId })
		const { result } = renderHook(() => useDeleteCard(), { wrapper })

		await act(async () => {
			result.current.mutate({ cardId })
		})

		await waitFor(() => {
			expect(navigate).toHaveBeenCalledWith({
				to: '/collection/$collectionId',
				params: { collectionId },
			})
		})
	})

	it('stays put when a card other than the open one is deleted', async () => {
		matchRoute.mockReturnValue(false)
		const { result } = renderHook(() => useDeleteCard(), { wrapper })

		await act(async () => {
			result.current.mutate({ cardId })
		})

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true)
		})
		expect(navigate).not.toHaveBeenCalled()
	})
})
