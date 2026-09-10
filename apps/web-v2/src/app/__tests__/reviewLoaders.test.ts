import { describe, expect, it, vi } from 'vitest'

import { Route as FlaggedRoute } from '~/app/routes/flagged'
import { Route as ReviewRoute } from '~/app/routes/review/route'
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
	flagged: FlaggedRoute.options.loader as unknown as Loader,
	review: ReviewRoute.options.loader as unknown as Loader,
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

	it('preloads all review queues for the current day', async () => {
		const loaderContext = context(true)
		const today = todayIso()

		await loaders.review({ context: loaderContext })

		expect(loaderContext.queryClient.ensureQueryData).toHaveBeenCalledTimes(
			3,
		)
		expect(loaderContext.queryClient.ensureQueryData).toHaveBeenCalledWith(
			dueQueries.listDue(today),
		)
		expect(loaderContext.queryClient.ensureQueryData).toHaveBeenCalledWith(
			dueQueries.listNew(),
		)
		expect(loaderContext.queryClient.ensureQueryData).toHaveBeenCalledWith(
			dueQueries.listLate(today),
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
