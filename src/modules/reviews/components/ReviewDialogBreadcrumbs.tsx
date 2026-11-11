import type { Id } from '@convex/_generated/dataModel'
import type {
	Collection,
	CollectionDetail,
} from '@convex/validators/collections'
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import {
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbSeparator,
} from '~/components/ui'
import { CollectionPathBreadcrumbs } from '~/modules/collections/components/CollectionPathBreadcrumbs'
import { formatBreadcrumbLabel } from '~/modules/collections/utils/formatBreadcrumbLabel'
import { breakpoints } from '~/styles/tokens.stylex'

import type { Card } from '../types/review.types'

const styles = stylex.create({
	desktopOnly: {
		display: {
			default: 'none',
			[breakpoints.tablet]: 'block',
		},
	},
})

type ReviewDialogBreadcrumbsProps = {
	card: Card | undefined
	cardId: Id<'cards'>
	collection: CollectionDetail | undefined
	/** Called when any breadcrumb link is clicked. */
	onNavigate: () => void
}

export function ReviewDialogBreadcrumbs({
	card,
	cardId,
	collection,
	onNavigate,
}: ReviewDialogBreadcrumbsProps) {
	const collections = collection
		? [...(collection.path as Array<Collection>), collection as Collection]
		: []

	// TODO(2): Add a mobile breadcrumb presentation.
	return (
		<div {...stylex.props(styles.desktopOnly)}>
			<CollectionPathBreadcrumbs
				collections={collections}
				onNavigate={onNavigate}
			>
				<BreadcrumbItem>
					<BreadcrumbLink
						render={
							<Link
								to='/cards/$cardId'
								params={{ cardId }}
								onClick={onNavigate}
							/>
						}
					>
						{formatBreadcrumbLabel(card?.prompt ?? 'Card')}
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbLink
						render={
							<Link
								to='/cards/$cardId/reviews'
								params={{ cardId }}
								onClick={onNavigate}
							/>
						}
					>
						Reviews
					</BreadcrumbLink>
				</BreadcrumbItem>
			</CollectionPathBreadcrumbs>
		</div>
	)
}
