import type { Id } from '@convex/_generated/dataModel'
import { describe, expect, it, vi } from 'vitest'

import { Route as CollectionRoute } from '~/app/routes/collection/$collectionId'
import { collectionQueries } from '~/modules/library/api/collectionQueries'
import { cardQueries } from '~/modules/reviews/api/cardQueries'

type LoaderContext = {
	auth: {
		isAuthenticated: boolean
		isLoading: boolean
	}
	queryClient: {
		ensureQueryData: ReturnType<typeof vi.fn>
	}
}

function createLoaderContext(isAuthenticated: boolean): LoaderContext {
	return {
		auth: {
			isAuthenticated,
			isLoading: !isAuthenticated,
		},
		queryClient: {
			ensureQueryData: vi.fn(),
		},
	}
}

describe('authenticated collection loaders', () => {
	it('does not load a collection before Convex authenticates', async () => {
		const context = createLoaderContext(false)
		const loader = CollectionRoute.options.loader as unknown as (args: {
			context: LoaderContext
			params: { collectionId: string }
		}) => Promise<unknown>

		await loader({ context, params: { collectionId: 'collection-1' } })

		expect(context.queryClient.ensureQueryData).not.toHaveBeenCalled()
	})

	it('warms collection children, detail, and cards after Convex authenticates', async () => {
		const context = createLoaderContext(true)
		context.queryClient.ensureQueryData.mockResolvedValue([])
		const loader = CollectionRoute.options.loader as unknown as (args: {
			context: LoaderContext
			params: { collectionId: Id<'collections'> }
		}) => Promise<unknown>
		const collectionId = 'collection-1' as Id<'collections'>

		await loader({ context, params: { collectionId } })

		expect(context.queryClient.ensureQueryData).toHaveBeenCalledTimes(3)
		expect(context.queryClient.ensureQueryData).toHaveBeenCalledWith(
			collectionQueries.children(collectionId),
		)
		expect(context.queryClient.ensureQueryData).toHaveBeenCalledWith(
			collectionQueries.detail(collectionId, { expandPath: true }),
		)
		expect(context.queryClient.ensureQueryData).toHaveBeenCalledWith(
			cardQueries.listByCollection(collectionId),
		)
	})
})
