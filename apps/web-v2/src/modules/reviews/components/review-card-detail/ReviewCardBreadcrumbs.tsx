import type { Id } from '@convex/_generated/dataModel'
import type { Topic } from '@convex/validators/topics'
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
				{path.map(crumb => (
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
