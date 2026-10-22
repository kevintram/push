import type { Id } from '@convex/_generated/dataModel'
import type {
	Collection,
	CollectionDetail,
} from '@convex/validators/collections'
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	DialogClose,
} from '~/components/ui'
import { formatBreadcrumbLabel } from '~/modules/collections/utils/formatBreadcrumbLabel'
import { breakpoints } from '~/styles/tokens.stylex'

import type { Card } from '../types/review.types'
import { ReviewDialogCollectionOverflowMenu } from './ReviewDialogCollectionOverflowMenu'

const MAX_VISIBLE_BREADCRUMB_ITEMS = 4

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
}

export function ReviewDialogBreadcrumbs({
	card,
	cardId,
	collection,
}: ReviewDialogBreadcrumbsProps) {
	const collections = collection
		? [...(collection.path as Array<Collection>), collection as Collection]
		: []
	const shouldCollapseCollections =
		// Full breadcrumb count: collections + card + Reviews.
		collections.length + 2 > MAX_VISIBLE_BREADCRUMB_ITEMS
	const visibleCollections = shouldCollapseCollections ? [] : collections
	const overflowCollections = shouldCollapseCollections ? collections : []

	// TODO(2): Add a mobile breadcrumb presentation.
	return (
		<Breadcrumb aria-label='Review location' xstyle={styles.desktopOnly}>
			<BreadcrumbList>
				{shouldCollapseCollections && (
					<>
						<BreadcrumbItem>
							<ReviewDialogCollectionOverflowMenu
								collections={overflowCollections}
							/>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
					</>
				)}
				{visibleCollections.map(collection => (
					<Fragment key={collection._id}>
						<BreadcrumbItem>
							<DialogClose
								nativeButton={false}
								render={
									<BreadcrumbLink
										render={
											<Link
												to='/collection/$collectionId'
												params={{
													collectionId:
														collection._id,
												}}
											/>
										}
									/>
								}
							>
								{formatBreadcrumbLabel(collection.title)}
							</DialogClose>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
					</Fragment>
				))}

				<BreadcrumbItem>
					<DialogClose
						nativeButton={false}
						render={
							<BreadcrumbLink
								render={
									<Link
										to='/cards/$cardId'
										params={{ cardId }}
									/>
								}
							/>
						}
					>
						{formatBreadcrumbLabel(card?.primaryText ?? 'Card')}
					</DialogClose>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<DialogClose
						nativeButton={false}
						render={
							<BreadcrumbLink
								render={
									<Link
										to='/cards/$cardId/reviews'
										params={{ cardId }}
									/>
								}
							/>
						}
					>
						Reviews
					</DialogClose>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	)
}
