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
import { type Topic } from '~/modules/library/types/topic.types'

function displayTitle(title: string) {
	return title.trim() || 'Untitled'
}

const styles = stylex.create({
	link: {
		textDecoration: 'none',
	},
})

export function TopicBreadcrumbs({
	ancestors,
	currentTitle,
}: {
	ancestors: Array<Topic>
	currentTitle: string
}) {
	const shouldCollapse = ancestors.length + 2 > 4
	const visibleAncestors = shouldCollapse ? ancestors.slice(-1) : ancestors
	const hiddenAncestors = shouldCollapse ? ancestors.slice(0, -1) : []

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink render={<Link to='/library' />}>
						Library
					</BreadcrumbLink>
				</BreadcrumbItem>
				{shouldCollapse && (
					<>
						<BreadcrumbSeparator>/</BreadcrumbSeparator>
						<BreadcrumbItem>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button.Icon
											aria-label='Show hidden topics'
											size='small'
											variant='ghost'
										/>
									}
								>
									<BreadcrumbEllipsis />
								</DropdownMenuTrigger>
								<DropdownMenuContent align='start'>
									<DropdownMenuGroup>
										{hiddenAncestors.map(ancestor => (
											<DropdownMenuItem
												key={ancestor._id}
												render={
													<Link
														to='/library/$topicId'
														params={{
															topicId:
																ancestor._id,
														}}
														{...stylex.props(
															styles.link,
														)}
													/>
												}
											>
												{displayTitle(ancestor.title)}
											</DropdownMenuItem>
										))}
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</BreadcrumbItem>
					</>
				)}
				{visibleAncestors.map(ancestor => (
					<Fragment key={ancestor._id}>
						<BreadcrumbSeparator>/</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbLink
								render={
									<Link
										to='/library/$topicId'
										params={{ topicId: ancestor._id }}
									/>
								}
							>
								{displayTitle(ancestor.title)}
							</BreadcrumbLink>
						</BreadcrumbItem>
					</Fragment>
				))}
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbItem>
					<BreadcrumbPage>
						{displayTitle(currentTitle)}
					</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	)
}
