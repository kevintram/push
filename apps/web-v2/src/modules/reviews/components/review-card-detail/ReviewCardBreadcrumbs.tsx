import type { Id } from '@convex/_generated/dataModel'
import type { Topic } from '@convex/validators/topics'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
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
import { topicQueries } from '~/modules/library/api/topicQueries'

function displayText(text: string) {
	return text.trim() || 'Untitled'
}

const styles = stylex.create({
	link: {
		textDecoration: 'none',
	},
})

type ReviewCardBreadcrumbsProps = {
	primaryText: string
	topicId: Id<'topics'>
	onNavigate?: () => void
}

export function ReviewCardBreadcrumbs({
	primaryText,
	topicId,
	onNavigate,
}: ReviewCardBreadcrumbsProps) {
	const { data: topic } = useSuspenseQuery(
		topicQueries.detail(topicId, { expandPath: true }),
	)
	const path = [...(topic.path as Array<Topic>), topic]
	const shouldCollapse = path.length + 2 > 4
	const visibleTopics = shouldCollapse ? path.slice(-1) : path
	const hiddenTopics = shouldCollapse ? path : []

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink
						render={<Link to='/library' onClick={onNavigate} />}
					>
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
										{hiddenTopics.map(crumb => (
											<DropdownMenuItem
												key={crumb._id}
												render={
													<Link
														to='/library/$topicId'
														params={{
															topicId: crumb._id,
														}}
														onClick={onNavigate}
														{...stylex.props(
															styles.link,
														)}
													/>
												}
											>
												{displayText(crumb.title)}
											</DropdownMenuItem>
										))}
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</BreadcrumbItem>
					</>
				)}
				{visibleTopics.map(crumb => (
					<Fragment key={crumb._id}>
						<BreadcrumbSeparator>/</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbLink
								render={
									<Link
										to='/library/$topicId'
										params={{ topicId: crumb._id }}
										onClick={onNavigate}
									/>
								}
							>
								{displayText(crumb.title)}
							</BreadcrumbLink>
						</BreadcrumbItem>
					</Fragment>
				))}
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbItem>
					<BreadcrumbPage>{displayText(primaryText)}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	)
}
