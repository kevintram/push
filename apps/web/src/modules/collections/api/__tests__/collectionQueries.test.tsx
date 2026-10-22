import type { Id } from '@convex/_generated/dataModel'
import type { Collection } from '@convex/validators/collections'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '~/testing/createTestQueryClient'

import { useDeleteCollection } from '../collectionQueries'

const navigate = vi.fn()
const matchRoute = vi.fn()
const removeCollection = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => navigate,
	useMatchRoute: () => matchRoute,
}))

vi.mock('@convex-dev/react-query', () => ({
	convexQuery: vi.fn(),
	useConvexMutation: () => removeCollection,
}))

const collectionId = 'collection-1' as Id<'collections'>
const parentId = 'collection-parent' as Id<'collections'>

function wrapper({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={createTestQueryClient()}>
			{children}
		</QueryClientProvider>
	)
}

async function deleteCollection(removed: Pick<Collection, '_id' | 'parentId'>) {
	removeCollection.mockResolvedValue(removed)
	const { result } = renderHook(() => useDeleteCollection(), { wrapper })

	await act(async () => {
		result.current.mutate({ collectionId: removed._id })
	})
	await waitFor(() => {
		expect(result.current.isSuccess).toBe(true)
	})
}

describe('useDeleteCollection', () => {
	it('falls back to the parent when the open collection is deleted', async () => {
		matchRoute.mockReturnValue({ collectionId })

		await deleteCollection({ _id: collectionId, parentId })

		expect(matchRoute).toHaveBeenCalledWith({
			to: '/collection/$collectionId',
			params: { collectionId },
		})
		expect(navigate).toHaveBeenCalledWith({
			to: '/collection/$collectionId',
			params: { collectionId: parentId },
		})
	})

	it('falls back to review when the open root collection is deleted', async () => {
		matchRoute.mockReturnValue({ collectionId })

		await deleteCollection({ _id: collectionId, parentId: undefined })

		expect(navigate).toHaveBeenCalledWith({ to: '/review' })
	})

	it('stays put when a collection other than the open one is deleted', async () => {
		matchRoute.mockReturnValue(false)

		await deleteCollection({ _id: collectionId, parentId })

		expect(navigate).not.toHaveBeenCalled()
	})
})
