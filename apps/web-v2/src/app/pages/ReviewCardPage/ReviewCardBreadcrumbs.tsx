import type { Id } from '@convex/_generated/dataModel'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '~/components/ui'
import { topicQueries } from '~/modules/library/api/topicQueries'

function displayText(text: string) {
	return text.trim() || 'Untitled'
}

/**
 * This topic-path lookup depends on the review card's topicId, creating a query
 * waterfall after the shell loads the review card.
 *
 * TODO(2): Remove the waterfall by returning the topic path with the review
 * card. Use stripe api style `expand` param?? (https://docs.stripe.com/api/expanding_objects).
 */
export function ReviewCardBreadcrumbs({
	primaryText,
	topicId,
}: {
	primaryText: string
	topicId: Id<'topics'>
}) {
	const { data: topicPath } = useSuspenseQuery(
		topicQueries.ancestorsOf(topicId, true),
	)

	if (topicPath.length === 0) {
		throw new Error('Topic path is empty')
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{topicPath.map((topic, index) => (
					<Fragment key={topic._id}>
						{index > 0 && (
							<BreadcrumbSeparator>/</BreadcrumbSeparator>
						)}
						<BreadcrumbItem>
							<BreadcrumbLink
								render={
									<Link
										to='/library/$topicId'
										params={{ topicId: topic._id }}
									/>
								}
							>
								{displayText(topic.title)}
							</BreadcrumbLink>
						</BreadcrumbItem>
					</Fragment>
				))}
				{topicPath.length > 0 && (
					<BreadcrumbSeparator>/</BreadcrumbSeparator>
				)}
				<BreadcrumbItem>
					<BreadcrumbPage>{displayText(primaryText)}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	)
}
