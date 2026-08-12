import { describe, expect, it, vi } from 'vitest'

import { Route as DueRoute } from '~/app/routes/review/due'
import { Route as LateRoute } from '~/app/routes/review/late'
import { Route as NewRoute } from '~/app/routes/review/new'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { todayIso } from '~/utils/date'

type LoaderContext = {
	auth: {
		isAuthenticated: boolean
		isLoading: boolean
	}
	queryClient: {
		ensureQueryData: ReturnType<typeof vi.fn>
	}
}

type Loader = (args: { context: LoaderContext }) => Promise<unknown> | unknown

function context(isAuthenticated: boolean): LoaderContext {
	return {
		auth: { isAuthenticated, isLoading: false },
		queryClient: { ensureQueryData: vi.fn().mockResolvedValue([]) },
	}
}

const loaders = {
	due: DueRoute.options.loader as unknown as Loader,
	late: LateRoute.options.loader as unknown as Loader,
	new: NewRoute.options.loader as unknown as Loader,
}

describe('review queue loaders', () => {
	it.each(Object.entries(loaders))(
		'does not preload %s before Convex authenticates',
		async (_name, loader) => {
			const loaderContext = context(false)

			await loader({ context: loaderContext })

			expect(
				loaderContext.queryClient.ensureQueryData,
			).not.toHaveBeenCalled()
		},
	)

	it('preloads only today for due', async () => {
		const loaderContext = context(true)

		await loaders.due({ context: loaderContext })

		expect(loaderContext.queryClient.ensureQueryData).toHaveBeenCalledWith(
			dueQueries.list(todayIso()),
		)
	})

	it('preloads dates before today for late', async () => {
		const loaderContext = context(true)

		await loaders.late({ context: loaderContext })

		expect(loaderContext.queryClient.ensureQueryData).toHaveBeenCalledWith(
			dueQueries.list({ to: todayIso() }),
		)
	})

	it('preloads new cards', async () => {
		const loaderContext = context(true)

		await loaders.new({ context: loaderContext })

		expect(loaderContext.queryClient.ensureQueryData).toHaveBeenCalledWith(
			reviewCardQueries.listNew(),
		)
	})
})
