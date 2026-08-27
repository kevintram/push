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

const MAX_VISIBLE_BREADCRUMB_ITEMS = 4

function formatBreadcrumbLabel(value: string) {
	return value.trim() || 'Untitled'
}

const styles = stylex.create({
	link: {
		textDecoration: 'none',
	},
})

type TopicPathBreadcrumbsProps = {
	topics: Array<Topic>
	currentLabel: string
	onNavigate?: () => void
}

export function TopicPathBreadcrumbs({
	topics,
	currentLabel,
	onNavigate,
}: TopicPathBreadcrumbsProps) {
	const shouldCollapseTopics =
		topics.length + 2 > MAX_VISIBLE_BREADCRUMB_ITEMS
	const visibleTopics = shouldCollapseTopics ? topics.slice(-1) : topics
	const overflowTopics = shouldCollapseTopics ? topics.slice(0, -1) : []

	return (
		<Breadcrumb aria-label='Topic path'>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink
						render={<Link to='/library' onClick={onNavigate} />}
					>
						Library
					</BreadcrumbLink>
				</BreadcrumbItem>
				{shouldCollapseTopics && (
					<>
						<BreadcrumbSeparator />
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
										{overflowTopics.map(topic => (
											<DropdownMenuItem
												key={topic._id}
												render={
													<Link
														to='/library/$topicId'
														params={{
															topicId: topic._id,
														}}
														onClick={onNavigate}
														{...stylex.props(
															styles.link,
														)}
													/>
												}
											>
												{formatBreadcrumbLabel(
													topic.title,
												)}
											</DropdownMenuItem>
										))}
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</BreadcrumbItem>
					</>
				)}
				{visibleTopics.map(topic => (
					<Fragment key={topic._id}>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								render={
									<Link
										to='/library/$topicId'
										params={{ topicId: topic._id }}
										onClick={onNavigate}
									/>
								}
							>
								{formatBreadcrumbLabel(topic.title)}
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
