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
import { type Topic } from '~/modules/library/types/topic.types'

function displayTitle(title: string) {
	return title.trim() || 'Untitled'
}

export function TopicBreadcrumbs({
	ancestors,
	currentTitle,
}: {
	ancestors: Array<Topic>
	currentTitle: string
}) {
	return (
		<Breadcrumb>
			<BreadcrumbList>
				{ancestors.map((ancestor, index) => (
					<Fragment key={ancestor._id}>
						{index > 0 && (
							<BreadcrumbSeparator>/</BreadcrumbSeparator>
						)}
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
				{ancestors.length > 0 && (
					<BreadcrumbSeparator>/</BreadcrumbSeparator>
				)}
				<BreadcrumbItem>
					<BreadcrumbPage>
						{displayTitle(currentTitle)}
					</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	)
}
