import type { Id } from '@convex/_generated/dataModel'
import { createFileRoute } from '@tanstack/react-router'

import { CollectionPage } from '~/app/pages/CollectionPage/CollectionPage'
import { collectionQueries } from '~/modules/collections/api/collectionQueries'
import { sectionQueries } from '~/modules/collections/api/sectionQueries'
import { cardQueries } from '~/modules/reviews/api/cardQueries'

export const Route = createFileRoute('/collection/$collectionId')({
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
				collectionQueries.children(params.collectionId),
			),
			queryClient.ensureQueryData(
				collectionQueries.detail(params.collectionId, {
					expandPath: true,
				}),
			),
			queryClient.ensureQueryData(
				sectionQueries.listByCollection(params.collectionId),
			),
			queryClient.ensureQueryData(
				cardQueries.listByCollection(params.collectionId),
			),
		])
	},
})
