import type { Id } from '@convex/_generated/dataModel'
import type { Card } from '@convex/validators/cards'
import type { Section } from '@convex/validators/sections'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { toast, toastName } from '~/components/ui/Toast'
import { createTestQueryClient } from '~/testing/createTestQueryClient'
import { toastTitleText } from '~/testing/toastTitleText'

import {
	useDeleteCollectionItems,
	useMoveCollectionItems,
} from '../collectionItemQueries'

const navigate = vi.fn()
const convexMutation = vi.fn()

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))

vi.mock('@convex-dev/react-query', () => ({
	convexQuery: () => ({ queryKey: ['collections'] }),
	useConvexMutation: () => convexMutation,
}))

function wrapper({ children }: { children: ReactNode }) {
	const client = createTestQueryClient()
	client.setQueryData(
		['collections'],
		[{ _id: destinationId, title: 'French' }],
	)
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const collectionId = 'collection-1' as Id<'collections'>
const destinationId = 'collection-2' as Id<'collections'>
const section = {
	_id: 'section-1' as Id<'sections'>,
	collectionId,
	rank: 'a0',
} as Section
// Unranked and unsectioned, which the placement spells as nulls.
const card = {
	_id: 'card-1' as Id<'cards'>,
	collectionId,
	prompt: 'Ribosome',
} as Card

async function move(sections: Array<Section>, cards: Array<Card>) {
	const addToast = vi.spyOn(toast, 'add')
	convexMutation.mockResolvedValue(null)
	const { result } = renderHook(() => useMoveCollectionItems(), { wrapper })

	await act(async () => {
		result.current.mutate({
			sections,
			cards,
			collectionId: destinationId,
			name: '1 section and 1 card',
		})
	})
	await waitFor(() => expect(addToast).toHaveBeenCalled())
	return addToast.mock.lastCall![0]
}

describe('useMoveCollectionItems', () => {
	it('names a lone item, and offers to open where it went', async () => {
		const { data, title } = await move([], [card])

		expect(toastTitleText(title)).toBe('Moved **Ribosome** to **French**')
		act(() => data?.open?.onClick())
		expect(navigate).toHaveBeenCalledWith({
			to: '/collection/$collectionId',
			params: { collectionId: destinationId },
		})
	})

	it('offers to put every item back where it was', async () => {
		const { actionProps, title } = await move([section], [card])

		expect(toastTitleText(title)).toBe(
			'Moved 1 section and 1 card to **French**',
		)
		act(() => actionProps?.onClick?.({} as never))

		expect(convexMutation).toHaveBeenLastCalledWith({
			sections: [{ sectionId: section._id, collectionId, rank: 'a0' }],
			cards: [
				{ cardId: card._id, collectionId, sectionId: null, rank: null },
			],
		})
	})
})

describe('useDeleteCollectionItems', () => {
	it.each([
		[toastName('Cells', 'Untitled section'), 'Deleted **Cells**'],
		['2 sections and 8 cards', 'Deleted 2 sections and 8 cards'],
	])('confirms one deletion with the captured name', async (name, title) => {
		const addToast = vi.spyOn(toast, 'add')
		convexMutation.mockResolvedValue(null)
		const { result } = renderHook(() => useDeleteCollectionItems(), {
			wrapper,
		})
		await act(async () => {
			await result.current.mutateAsync({
				sectionIds: [section._id],
				cardIds: [card._id],
				name,
			})
		})
		expect(convexMutation).toHaveBeenCalledExactlyOnceWith({
			sectionIds: [section._id],
			cardIds: [card._id],
		})
		expect(addToast).toHaveBeenCalledTimes(1)
		expect(toastTitleText(addToast.mock.lastCall![0].title)).toBe(title)
	})
})
