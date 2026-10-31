import type { Id } from '@convex/_generated/dataModel'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { toast } from '~/components/ui/Toast'
import { createTestQueryClient } from '~/testing/createTestQueryClient'
import { toastTitleText } from '~/testing/toastTitleText'

import { useDeleteReview } from '../reviewQueries'

const remove = vi.fn()
vi.mock('@convex-dev/react-query', () => ({
	convexQuery: vi.fn(),
	useConvexMutation: () => remove,
}))

function wrapper({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={createTestQueryClient()}>
			{children}
		</QueryClientProvider>
	)
}

describe('useDeleteReview', () => {
	it.each([
		[
			'Practised generator delegation',
			'Deleted **Practised generator delegation**',
		],
		[' ', 'Deleted review'],
	])(
		'confirms deletion of a review described as %s',
		async (description, title) => {
			const addToast = vi.spyOn(toast, 'add')
			remove.mockResolvedValue({ description })
			const { result } = renderHook(() => useDeleteReview(), { wrapper })
			await act(async () => {
				await result.current.mutateAsync({
					reviewId: 'review-1' as Id<'reviews'>,
				})
			})
			expect(addToast).toHaveBeenCalledTimes(1)
			expect(toastTitleText(addToast.mock.lastCall![0].title)).toBe(title)
			expect(addToast.mock.lastCall![0].type).toBe('success')
		},
	)
})
