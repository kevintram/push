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
		collections.length + 2 > MAX_VISIBLE_BREADCRUMB_ITEMS
	const visibleCollections = shouldCollapseCollections
		? collections.slice(-1)
		: collections
	const overflowCollections = shouldCollapseCollections
		? collections.slice(0, -1)
		: []

	return (
		<Breadcrumb aria-label='Collection path'>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink
						render={<Link to='/library' onClick={onNavigate} />}
					>
						Library
					</BreadcrumbLink>
				</BreadcrumbItem>
				{shouldCollapseCollections && (
					<>
						<BreadcrumbSeparator />
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
														to='/library/$collectionId'
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
					</>
				)}
				{visibleCollections.map(collection => (
					<Fragment key={collection._id}>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								render={
									<Link
										to='/library/$collectionId'
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
					</Fragment>
				))}
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>
						{formatBreadcrumbLabel(currentLabel)}
					</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	)
}
