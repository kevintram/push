import type { Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import type { Section } from '@convex/validators/sections'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { toast } from '~/components/ui/Toast'
import { createTestQueryClient } from '~/testing/createTestQueryClient'

import { useMoveCollectionItems } from '../collectionItemQueries'

const convexMutation = vi.fn()

vi.mock('@convex-dev/react-query', () => ({
	useConvexMutation: () => convexMutation,
}))

function wrapper({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={createTestQueryClient()}>
			{children}
		</QueryClientProvider>
	)
}

const collectionId = 'collection-1' as Id<'collections'>
const section = {
	_id: 'section-1' as Id<'sections'>,
	collectionId,
	rank: 'a0',
} as Section
// Unranked and unsectioned, which the placement spells as nulls.
const card = { _id: 'card-1' as Id<'cards'>, collectionId } as Card

describe('useMoveCollectionItems', () => {
	it('offers to put every item back where it was', async () => {
		const addToast = vi.spyOn(toast, 'add')
		convexMutation.mockResolvedValue(null)
		const { result } = renderHook(() => useMoveCollectionItems(), {
			wrapper,
		})

		await act(async () => {
			result.current.mutate({
				sections: [section],
				cards: [card],
				collectionId: 'collection-2' as Id<'collections'>,
				name: '1 section and 1 card',
			})
		})
		await waitFor(() => expect(addToast).toHaveBeenCalled())
		const [{ actionProps, title }] = addToast.mock.lastCall!
		expect(title).toBe('Moved 1 section and 1 card')
		act(() => actionProps?.onClick?.({} as never))

		expect(convexMutation).toHaveBeenLastCalledWith({
			sections: [{ sectionId: section._id, collectionId, rank: 'a0' }],
			cards: [
				{ cardId: card._id, collectionId, sectionId: null, rank: null },
			],
		})
	})
})
