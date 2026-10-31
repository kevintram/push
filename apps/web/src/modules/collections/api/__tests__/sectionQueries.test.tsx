import type { Section } from '@convex/validators/sections'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { toast } from '~/components/ui/Toast'
import { createTestQueryClient } from '~/testing/createTestQueryClient'
import { toastTitleText } from '~/testing/toastTitleText'

import { useConvertSectionsToCollections } from '../sectionQueries'

const navigate = vi.fn()
const convertToCollection = vi.fn()

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))

vi.mock('@convex-dev/react-query', () => ({
	convexQuery: vi.fn(),
	useConvexMutation: () => convertToCollection,
}))

function wrapper({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={createTestQueryClient()}>
			{children}
		</QueryClientProvider>
	)
}

async function convert(sectionIds: Array<string>) {
	const addToast = vi.spyOn(toast, 'add')
	convertToCollection.mockResolvedValue(
		sectionIds.map(id => `collection-of-${id}`),
	)
	const { result } = renderHook(() => useConvertSectionsToCollections(), {
		wrapper,
	})

	await act(async () => {
		result.current.mutate({
			sections: sectionIds.map(
				id => ({ _id: id, title: 'Cells' }) as unknown as Section,
			),
		})
	})
	await waitFor(() => expect(addToast).toHaveBeenCalled())
	return addToast.mock.lastCall![0]
}

describe('useConvertSectionsToCollections', () => {
	it('offers to open the one new subcollection', async () => {
		const { data, title } = await convert(['section-1'])

		expect(toastTitleText(title)).toBe(
			'Converted **Cells** to a subcollection',
		)
		act(() => data?.open?.onClick())
		expect(navigate).toHaveBeenCalledWith({
			to: '/collection/$collectionId',
			params: { collectionId: 'collection-of-section-1' },
		})
	})

	it('only counts several new subcollections', async () => {
		const { data, title } = await convert(['section-1', 'section-2'])

		expect(toastTitleText(title)).toBe(
			'Converted 2 sections to subcollections',
		)
		expect(data?.open).toBeUndefined()
	})
})
