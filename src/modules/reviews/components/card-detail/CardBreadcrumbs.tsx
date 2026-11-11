import type { Id } from '@convex/_generated/dataModel'
import type { Collection } from '@convex/validators/collections'
import { useSuspenseQuery } from '@tanstack/react-query'

import { BreadcrumbItem, BreadcrumbPage } from '~/components/ui'
import { collectionQueries } from '~/modules/collections/api/collectionQueries'
import { CollectionPathBreadcrumbs } from '~/modules/collections/components/CollectionPathBreadcrumbs'
import { formatBreadcrumbLabel } from '~/modules/collections/utils/formatBreadcrumbLabel'

type CardBreadcrumbsProps = {
	prompt: string
	collectionId: Id<'collections'>
	onNavigate?: () => void
}

export function CardBreadcrumbs({
	prompt,
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
			onNavigate={onNavigate}
		>
			<BreadcrumbItem>
				<BreadcrumbPage>{formatBreadcrumbLabel(prompt)}</BreadcrumbPage>
			</BreadcrumbItem>
		</CollectionPathBreadcrumbs>
	)
}
