import { describe, expect, it, vi } from 'vitest'

import { Route as FlaggedRoute } from '~/app/routes/flagged'
import { Route as DueRoute } from '~/app/routes/review/due'
import { Route as LateRoute } from '~/app/routes/review/late'
import { Route as NewRoute } from '~/app/routes/review/new'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
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
	flagged: FlaggedRoute.options.loader as unknown as Loader,
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
			dueQueries.listDue(todayIso()),
		)
	})

	it('preloads dates before today for late', async () => {
		const loaderContext = context(true)

		await loaders.late({ context: loaderContext })

		expect(loaderContext.queryClient.ensureQueryData).toHaveBeenCalledWith(
			dueQueries.listLate(todayIso()),
		)
	})

	it('preloads new cards', async () => {
		const loaderContext = context(true)

		await loaders.new({ context: loaderContext })

		expect(loaderContext.queryClient.ensureQueryData).toHaveBeenCalledWith(
			dueQueries.listNew(),
		)
	})

	it('preloads flagged cards', async () => {
		const loaderContext = context(true)

		await loaders.flagged({ context: loaderContext })

		expect(loaderContext.queryClient.ensureQueryData).toHaveBeenCalledWith(
			cardQueries.listFlagged(),
		)
	})
})
