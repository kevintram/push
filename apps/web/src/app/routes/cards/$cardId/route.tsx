import type { Id } from '@convex/_generated/dataModel'
import { createFileRoute } from '@tanstack/react-router'

import { CardPage } from '~/app/pages/CardPage'
import { collectionQueries } from '~/modules/library/api/collectionQueries'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { reviewQueries } from '~/modules/reviews/api/reviewQueries'

export const Route = createFileRoute('/cards/$cardId')({
	component: CardPage,
	// The path segment is only ever a card document id, so brand it once
	// here instead of casting at every consumer.
	params: {
		parse: (params: { cardId: string }) => ({
			cardId: params.cardId as Id<'cards'>,
		}),
		stringify: (params: { cardId: Id<'cards'> }) => ({
			cardId: params.cardId,
		}),
	},
	loader: async ({ context: { auth, queryClient }, params }) => {
		if (!auth.isAuthenticated) return

		const card = queryClient.ensureQueryData(
			cardQueries.detail(params.cardId),
		)

		await Promise.all([
			card,
			queryClient.ensureQueryData(
				reviewQueries.listByCard(params.cardId),
			),
			// The breadcrumb trail is keyed by the card's collection id, so it can
			// only be fired once the card lands. That second hop buys not
			// shipping the user's whole collection list to a route outside
			// `/library`, which has no other use for it.
			card.then(({ collectionId }) =>
				queryClient.ensureQueryData(
					collectionQueries.detail(collectionId, {
						expandPath: true,
					}),
				),
			),
		])
	},
})
