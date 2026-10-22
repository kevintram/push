import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Fragment, type ReactNode } from 'react'

import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { type Collection } from '~/modules/collections/types/collection.types'
import { formatBreadcrumbLabel } from '~/modules/collections/utils/formatBreadcrumbLabel'

const MAX_VISIBLE_BREADCRUMB_ITEMS = 4

const styles = stylex.create({
	link: {
		textDecoration: 'none',
	},
})

type CollectionPathBreadcrumbsProps = {
	/** Root-first collections. */
	collections: Array<Collection>
	/** Breadcrumb items after the collections, such as the current page. */
	children: ReactNode
	/** Called when any collection link, visible or hidden, is clicked. */
	onNavigate?: () => void
}

export function CollectionPathBreadcrumbs({
	collections,
	children,
	onNavigate,
}: CollectionPathBreadcrumbsProps) {
	const shouldCollapseCollections =
		collections.length + 1 > MAX_VISIBLE_BREADCRUMB_ITEMS
	const visibleCollections = shouldCollapseCollections
		? collections.slice(-1)
		: collections
	const overflowCollections = shouldCollapseCollections
		? collections.slice(0, -1)
		: []

	return (
		<Breadcrumb aria-label='Collection path'>
			<BreadcrumbList>
				{shouldCollapseCollections && (
					<>
						<BreadcrumbItem>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button
											aria-label='Show hidden collections'
											iconOnly
											size='small'
											variant='ghost'
										/>
									}
								>
									<BreadcrumbEllipsis />
								</DropdownMenuTrigger>
								<DropdownMenuContent align='start'>
									<DropdownMenuGroup>
										{overflowCollections.map(collection => (
											<DropdownMenuItem
												key={collection._id}
												render={
													<Link
														to='/collection/$collectionId'
														params={{
															collectionId:
																collection._id,
														}}
														onClick={onNavigate}
														{...stylex.props(
															styles.link,
														)}
													/>
												}
											>
												{formatBreadcrumbLabel(
													collection.title,
												)}
											</DropdownMenuItem>
										))}
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
					</>
				)}
				{visibleCollections.map(collection => (
					<Fragment key={collection._id}>
						<BreadcrumbItem>
							<BreadcrumbLink
								render={
									<Link
										to='/collection/$collectionId'
										params={{
											collectionId: collection._id,
										}}
										onClick={onNavigate}
									/>
								}
							>
								{formatBreadcrumbLabel(collection.title)}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
					</Fragment>
				))}
				{children}
			</BreadcrumbList>
		</Breadcrumb>
	)
}
