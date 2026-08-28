import type { Id } from '@convex/_generated/dataModel'
import type { Topic, TopicDetail } from '@convex/validators/topics'
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
import { breakpoints } from '~/styles/tokens.stylex'

import type { ReviewCard } from '../types/review.types'
import { ReviewDialogTopicOverflowMenu } from './ReviewDialogTopicOverflowMenu'

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
	reviewCard: ReviewCard | undefined
	reviewCardId: Id<'reviewCards'>
	topic: TopicDetail | undefined
}

function formatBreadcrumbLabel(value: string) {
	return value.trim() || 'Untitled'
}

export function ReviewDialogBreadcrumbs({
	reviewCard,
	reviewCardId,
	topic,
}: ReviewDialogBreadcrumbsProps) {
	const topics = topic
		? [...(topic.path as Array<Topic>), topic as Topic]
		: []
	const shouldCollapseTopics =
		// Full breadcrumb count: Library + topics + review card + Reviews.
		topics.length + 3 > MAX_VISIBLE_BREADCRUMB_ITEMS
	const visibleTopics = shouldCollapseTopics ? [] : topics
	const overflowTopics = shouldCollapseTopics ? topics : []

	// TODO(2): Add a mobile breadcrumb presentation.
	return (
		<Breadcrumb aria-label='Review location' xstyle={styles.desktopOnly}>
			<BreadcrumbList>
				<BreadcrumbItem>
					<DialogClose
						nativeButton={false}
						render={
							<BreadcrumbLink render={<Link to='/library' />} />
						}
					>
						Library
					</DialogClose>
				</BreadcrumbItem>

				{shouldCollapseTopics && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<ReviewDialogTopicOverflowMenu
								topics={overflowTopics}
							/>
						</BreadcrumbItem>
					</>
				)}
				{visibleTopics.map(topic => (
					<Fragment key={topic._id}>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<DialogClose
								nativeButton={false}
								render={
									<BreadcrumbLink
										render={
											<Link
												to='/library/$topicId'
												params={{
													topicId: topic._id,
												}}
											/>
										}
									/>
								}
							>
								{formatBreadcrumbLabel(topic.title)}
							</DialogClose>
						</BreadcrumbItem>
					</Fragment>
				))}

				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<DialogClose
						nativeButton={false}
						render={
							<BreadcrumbLink
								render={
									<Link
										to='/review-cards/$reviewCardId'
										params={{ reviewCardId }}
									/>
								}
							/>
						}
					>
						{formatBreadcrumbLabel(
							reviewCard?.primaryText ?? 'Review card',
						)}
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
										to='/review-cards/$reviewCardId/reviews'
										params={{ reviewCardId }}
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
