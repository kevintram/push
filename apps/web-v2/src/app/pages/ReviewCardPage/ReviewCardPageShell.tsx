import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, Outlet, useMatchRoute, useParams } from '@tanstack/react-router'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { ReviewCardActions } from '~/modules/reviews/components/ReviewCardActions'
import { colorsV2 } from '~/styles/colorsV2.stylex'
import { spacing } from '~/styles/tokens.stylex'

import { ReviewCardBreadcrumbs } from './ReviewCardBreadcrumbs'

const styles = stylex.create({
	container: {
		blockSize: '100%',
		inlineSize: '100%',

		display: 'flex',
		flexDirection: 'column',

		overflow: 'hidden',
	},
	toolbar: {
		padding: spacing.lg,
		display: 'flex',

		alignItems: 'center',
		justifyContent: 'space-between',

		borderBottomColor: colorsV2.borderPrimary,
		borderBottomStyle: 'solid',
		borderBottomWidth: '1px',
	},
	tabsContainer: {
		padding: spacing.lg,
	},
	tabs: {
		backgroundColor: colorsV2.surfaceTransparent,
	},
	tabLink: {
		textDecoration: 'none',
	},
	content: {
		padding: spacing.lg,
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
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.toolbar)}>
				<ReviewCardBreadcrumbs
					primaryText={reviewCard.primaryText}
					topicId={reviewCard.topicId}
				/>
				<ReviewCardActions reviewCard={reviewCard} />
			</div>
			<Tabs value={activeTab} xstyle={styles.tabsContainer}>
				<TabsList
					aria-label='Review card sections'
					xstyle={styles.tabs}
				>
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
						value='reviews'
						nativeButton={false}
						render={
							<Link
								to='/review-cards/$reviewCardId/reviews'
								params={{ reviewCardId }}
								{...stylex.props(styles.tabLink)}
							/>
						}
					>
						Reviews
					</TabsTrigger>
				</TabsList>
			</Tabs>
			<div {...stylex.props(styles.content)}>
				<Outlet />
			</div>
		</div>
	)
}
