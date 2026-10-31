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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { type Collection } from '~/modules/collections/types/collection.types'
import { collapseCollectionPath } from '~/modules/collections/utils/collapseCollectionPath'
import { formatBreadcrumbLabel } from '~/modules/collections/utils/formatBreadcrumbLabel'

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
	const { head, hidden, tail } = collapseCollectionPath(collections)

	const renderCollection = (collection: Collection) => (
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
	)

	return (
		<Breadcrumb aria-label='Collection path'>
			<BreadcrumbList>
				{head.map(renderCollection)}
				{hidden.length > 0 && (
					<>
						<BreadcrumbItem>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<BreadcrumbEllipsis aria-label='Show hidden collections' />
									}
								/>
								<DropdownMenuContent align='start'>
									<DropdownMenuGroup>
										{hidden.map(collection => (
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
				{tail.map(renderCollection)}
				{children}
			</BreadcrumbList>
		</Breadcrumb>
	)
}
