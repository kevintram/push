import type { Id } from '@convex/_generated/dataModel'
import type { Collection } from '@convex/validators/collections'
import { useSuspenseQuery } from '@tanstack/react-query'

import { collectionQueries } from '~/modules/library/api/collectionQueries'
import { CollectionPathBreadcrumbs } from '~/modules/library/components/CollectionPathBreadcrumbs'

type CardBreadcrumbsProps = {
	primaryText: string
	collectionId: Id<'collections'>
	onNavigate?: () => void
}

export function CardBreadcrumbs({
	primaryText,
	collectionId,
	onNavigate,
}: CardBreadcrumbsProps) {
	const { data: collection } = useSuspenseQuery(
		collectionQueries.detail(collectionId, { expandPath: true }),
	)
	return (
		<CollectionPathBreadcrumbs
			collections={[
				...(collection.path as Array<Collection>),
				collection as Collection,
			]}
			currentLabel={primaryText}
			onNavigate={onNavigate}
		/>
	)
}
