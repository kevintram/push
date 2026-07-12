import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, useMatchRoute, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui'
import { topicQueries } from '~/modules/library/api/queries'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	outerContainer: {
		padding: spacing.lg,
	},
	link: {
		display: 'flex',

		gap: spacing.sm,

		textDecoration: {
			default: 'none',
			':hover': 'underline',
		},
		color: 'inherit',
	},
	tabLink: {
		textDecoration: 'none',
	},
})

export function ReviewCardPageLayout() {
	const { reviewCardId, topicId } = useParams({
		from: '/library/$topicId_/$reviewCardId',
	})

	const { data: topic } = useQuery(topicQueries.detail(topicId))

	const matchRoute = useMatchRoute()
	const activeTab = matchRoute({
		to: '/library/$topicId/$reviewCardId/review',
		params: { reviewCardId, topicId },
	})
		? 'review'
		: 'overview'

	return (
		<div {...stylex.props(styles.outerContainer)}>
			<Tabs value={activeTab}>
				<header>
					<Link
						to='/library/$topicId'
						params={{ topicId }}
						{...stylex.props(styles.link)}
					>
						<ArrowLeft />
						{topic?.title}
					</Link>
					<TabsList aria-label='Review card sections'>
						<TabsTrigger
							value='overview'
							nativeButton={false}
							render={
								<Link
									to='/library/$topicId/$reviewCardId'
									params={{ reviewCardId, topicId }}
									{...stylex.props(styles.tabLink)}
								/>
							}
						>
							Overview
						</TabsTrigger>
						<TabsTrigger
							value='review'
							nativeButton={false}
							render={
								<Link
									to='/library/$topicId/$reviewCardId/review'
									params={{ reviewCardId, topicId }}
									{...stylex.props(styles.tabLink)}
								/>
							}
						>
							Review
						</TabsTrigger>
					</TabsList>
				</header>
				<Outlet />
			</Tabs>
		</div>
	)
}
