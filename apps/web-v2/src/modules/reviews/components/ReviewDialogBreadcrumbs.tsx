import type { Id } from '@convex/_generated/dataModel'
import type { Topic, TopicDetail } from '@convex/validators/topics'
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	DialogClose,
} from '~/components/ui'
import { breakpoints } from '~/styles/tokens.stylex'

import type { ReviewCard } from '../types/review.types'

const styles = stylex.create({
	desktopList: {
		display: {
			default: 'none',
			[breakpoints.tablet]: 'flex',
		},
	},
	mobileList: {
		display: {
			default: 'flex',
			[breakpoints.tablet]: 'none',
		},
	},
})

type ReviewDialogBreadcrumbsProps = {
	reviewCard: ReviewCard | undefined
	reviewCardId: Id<'reviewCards'>
	topic: TopicDetail | undefined
}

function displayText(text: string) {
	return text.trim() || 'Untitled'
}

export function ReviewDialogBreadcrumbs({
	reviewCard,
	reviewCardId,
	topic,
}: ReviewDialogBreadcrumbsProps) {
	const topicPath = topic
		? [...(topic.path as Array<Topic>), topic as Topic]
		: []

	return (
		<Breadcrumb aria-label='Review location'>
			<BreadcrumbList xstyle={styles.desktopList}>
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
				{topicPath.map(crumb => (
					<Fragment key={crumb._id}>
						<BreadcrumbSeparator>/</BreadcrumbSeparator>
						<BreadcrumbItem>
							<DialogClose
								nativeButton={false}
								render={
									<BreadcrumbLink
										render={
											<Link
												to='/library/$topicId'
												params={{ topicId: crumb._id }}
											/>
										}
									/>
								}
							>
								{displayText(crumb.title)}
							</DialogClose>
						</BreadcrumbItem>
					</Fragment>
				))}
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
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
						{displayText(reviewCard?.primaryText ?? 'Review card')}
					</DialogClose>
				</BreadcrumbItem>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
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
			<BreadcrumbList xstyle={styles.mobileList}>
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
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbItem>
					<BreadcrumbEllipsis />
				</BreadcrumbItem>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
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
						{displayText(reviewCard?.primaryText ?? 'Review card')}
					</DialogClose>
				</BreadcrumbItem>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
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
