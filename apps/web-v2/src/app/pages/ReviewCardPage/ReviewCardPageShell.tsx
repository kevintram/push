import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, Outlet, useMatchRoute, useParams } from '@tanstack/react-router'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { spacing } from '~/styles/tokens.stylex'

import { ReviewCardBreadcrumbs } from './ReviewCardBreadcrumbs'

const styles = stylex.create({
	outerContainer: {
		blockSize: '100%',
		inlineSize: '100%',

		display: 'flex',
		flexDirection: 'column',

		padding: spacing.sm,

		overflow: 'hidden',
	},
	header: {
		display: 'flex',

		gap: spacing.sm,
		alignItems: 'center',
	},
	tabs: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	tabLink: {
		textDecoration: 'none',
	},
})

export function ReviewCardPageShell() {
	const { reviewCardId } = useParams({
		from: '/review-cards/$reviewCardId',
	})
	const { data: reviewCard } = useSuspenseQuery(
		reviewCardQueries.detail(reviewCardId),
	)
	const matchRoute = useMatchRoute()
	const activeTab = matchRoute({
		to: '/review-cards/$reviewCardId/reviews',
		params: { reviewCardId },
	})
		? 'review'
		: 'overview'

	return (
		<div {...stylex.props(styles.outerContainer)}>
			<header {...stylex.props(styles.header)}>
				<Tabs value={activeTab} xstyle={styles.tabs}>
					<ReviewCardBreadcrumbs
						primaryText={reviewCard.primaryText}
						topicId={reviewCard.topicId}
					/>
					<TabsList aria-label='Review card sections'>
						<TabsTrigger
							value='overview'
							nativeButton={false}
							render={
								<Link
									to='/review-cards/$reviewCardId'
									params={{ reviewCardId }}
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
									to='/review-cards/$reviewCardId/reviews'
									params={{ reviewCardId }}
									{...stylex.props(styles.tabLink)}
								/>
							}
						>
							Review
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</header>
			<Outlet />
		</div>
	)
}
