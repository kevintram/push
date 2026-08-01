import { describe, expect, it, vi } from 'vitest'

import { Route as TopicRoute } from '~/app/routes/library/$topicId'
import { Route as LibraryRoute } from '~/app/routes/library/route'

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

describe('authenticated library loaders', () => {
	it('does not load the topic list before Convex authenticates', async () => {
		const context = createLoaderContext(false)
		const loader = LibraryRoute.options.loader as unknown as (args: {
			context: LoaderContext
		}) => Promise<unknown> | unknown

		await loader({ context })

		expect(context.queryClient.ensureQueryData).not.toHaveBeenCalled()
	})

	it('does not load a topic before Convex authenticates', async () => {
		const context = createLoaderContext(false)
		const loader = TopicRoute.options.loader as unknown as (args: {
			context: LoaderContext
			params: { topicId: string }
		}) => Promise<unknown>

		await loader({ context, params: { topicId: 'topic-1' } })

		expect(context.queryClient.ensureQueryData).not.toHaveBeenCalled()
	})

	it('warms the topic list after Convex authenticates', async () => {
		const context = createLoaderContext(true)
		context.queryClient.ensureQueryData.mockResolvedValue([])
		const loader = LibraryRoute.options.loader as unknown as (args: {
			context: LoaderContext
		}) => Promise<unknown>

		await loader({ context })

		expect(context.queryClient.ensureQueryData).toHaveBeenCalledOnce()
	})
})
