import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, Outlet, useMatchRoute, useParams } from '@tanstack/react-router'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { ReviewCardActions } from '~/modules/reviews/components/ReviewCardActions'
import { semanticColors } from '~/styles/colors/semantic.stylex'
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
		gap: spacing.md,
		paddingBlock: spacing.sm,
		paddingInline: spacing.lg,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'space-between',
	},
	breadcrumbs: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,
	},
	tabsContainer: {
		paddingInline: spacing.lg,
		flexShrink: 0,
	},
	tabs: {
		backgroundColor: semanticColors.surfaceTransparent,
	},
	tabLink: {
		textDecoration: 'none',
	},
	content: {
		overflow: 'hidden',
		paddingInline: spacing.lg,
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		paddingBlockEnd: spacing.lg,
		minHeight: 0,
		minWidth: 0,
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
			<header {...stylex.props(styles.toolbar)}>
				<div {...stylex.props(styles.breadcrumbs)}>
					<ReviewCardBreadcrumbs
						primaryText={reviewCard.primaryText}
						topicId={reviewCard.topicId}
					/>
				</div>
				<ReviewCardActions reviewCard={reviewCard} />
			</header>
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
