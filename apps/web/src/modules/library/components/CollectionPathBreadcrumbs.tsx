import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { type Collection } from '~/modules/library/types/collection.types'

const MAX_VISIBLE_BREADCRUMB_ITEMS = 4

function formatBreadcrumbLabel(value: string) {
	return value.trim() || 'Untitled'
}

const styles = stylex.create({
	link: {
		textDecoration: 'none',
	},
})

type CollectionPathBreadcrumbsProps = {
	collections: Array<Collection>
	currentLabel: string
	onNavigate?: () => void
}

export function CollectionPathBreadcrumbs({
	collections,
	currentLabel,
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
				<BreadcrumbItem>
					<BreadcrumbPage>
						{formatBreadcrumbLabel(currentLabel)}
					</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	)
}
