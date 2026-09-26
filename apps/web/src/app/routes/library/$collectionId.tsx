import type { Id } from '@convex/_generated/dataModel'
import { createFileRoute } from '@tanstack/react-router'

import { CollectionPage } from '~/app/pages/CollectionPage'
import { collectionQueries } from '~/modules/library/api/collectionQueries'
import { cardQueries } from '~/modules/reviews/api/cardQueries'

export const Route = createFileRoute('/library/$collectionId')({
	component: CollectionPage,
	// The path segment is only ever a collection document id, so brand it once here
	// instead of casting at every consumer.
	params: {
		parse: (params: { collectionId: string }) => ({
			collectionId: params.collectionId as Id<'collections'>,
		}),
		stringify: (params: { collectionId: Id<'collections'> }) => ({
			collectionId: params.collectionId,
		}),
	},
	loader: async ({ context: { auth, queryClient }, params }) => {
		if (!auth.isAuthenticated) return

		await Promise.all([
			queryClient.ensureQueryData(
				collectionQueries.detail(params.collectionId, {
					expandPath: true,
				}),
			),
			queryClient.ensureQueryData(
				cardQueries.listByCollection(params.collectionId),
			),
		])
	},
})
