import type { Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ConvexError } from 'convex/values'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { toast } from '~/components/ui/Toast'
import { createTestQueryClient } from '~/testing/createTestQueryClient'

import { useDeleteCards, useUpdateCard, useUpdateCards } from '../cardQueries'

const navigate = vi.fn()
const matchRoute = vi.fn()
const convexMutation = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => navigate,
	useMatchRoute: () => matchRoute,
}))

vi.mock('@convex-dev/react-query', () => ({
	convexQuery: vi.fn(),
	useConvexMutation: () => convexMutation,
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

describe('useDeleteCards', () => {
	beforeEach(() => {
		convexMutation.mockResolvedValue([removedCard])
	})

	it('falls back to the collection when the open card is deleted', async () => {
		matchRoute.mockReturnValue({ cardId })
		const { result } = renderHook(() => useDeleteCards(), { wrapper })

		await act(async () => {
			result.current.mutate({ cardIds: [cardId] })
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
		const { result } = renderHook(() => useDeleteCards(), { wrapper })

		await act(async () => {
			result.current.mutate({ cardIds: [cardId] })
		})

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true)
		})
		expect(navigate).not.toHaveBeenCalled()
	})
})

describe('useUpdateCard errors', () => {
	it.each([
		['an edit', { primaryText: 'Front' }, 'Failed to update card'],
		['a move', { collectionId }, 'Failed to move card'],
	])('titles the toast for %s', async (_name, patch, title) => {
		const addToast = vi.spyOn(toast, 'add')
		convexMutation.mockRejectedValue(new ConvexError('Card not found'))
		const { result } = renderHook(() => useUpdateCard(), { wrapper })

		await act(async () => {
			result.current.mutate({ cardId, ...patch })
		})

		await waitFor(() => {
			expect(addToast).toHaveBeenCalledWith({
				description: 'Card not found',
				title,
				type: 'error',
			})
		})
	})
})

describe('useUpdateCards errors', () => {
	it.each([
		[
			'a move of one card',
			[cardId],
			{ collectionId },
			'Failed to move card',
		],
		[
			'a flag of several cards',
			[cardId, 'card-2' as Id<'cards'>],
			{ flaggedAt: 1 },
			'Failed to update card flags',
		],
	])('titles the toast for %s', async (_name, cardIds, patch, title) => {
		const addToast = vi.spyOn(toast, 'add')
		convexMutation.mockRejectedValue(new ConvexError('Card not found'))
		const { result } = renderHook(() => useUpdateCards(), { wrapper })

		await act(async () => {
			result.current.mutate({ cardIds, ...patch })
		})

		await waitFor(() => {
			expect(addToast).toHaveBeenCalledWith({
				description: 'Card not found',
				title,
				type: 'error',
			})
		})
	})
})
