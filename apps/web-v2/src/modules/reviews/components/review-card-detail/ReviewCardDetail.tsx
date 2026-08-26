import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'

import { Tabs, TabsList, TabsTrigger } from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { deriveReviewCardSrsState } from '~/modules/reviews/utils/reviewCardSrs'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { spacing } from '~/styles/tokens.stylex'

import { ReviewCardActions } from '../ReviewCardActions'
import { ReviewCardBreadcrumbs } from './ReviewCardBreadcrumbs'
import { ReviewCardOverview } from './ReviewCardOverview'
import { ReviewCardReviews } from './ReviewCardReviews'
import { ReviewCardSidebar } from './ReviewCardSidebar'

export type ReviewCardTab = 'overview' | 'reviews'

type ReviewCardDetailBaseProps = {
	reviewCardId: Id<'reviewCards'>
	activeTab: ReviewCardTab
	/** Called when an internal breadcrumb link is about to navigate. */
	onNavigate?: () => void
}

type ReviewCardDetailProps = ReviewCardDetailBaseProps &
	(
		| {
				onTabChange: (tab: ReviewCardTab) => void
				tabLinks?: never
		  }
		| {
				onTabChange?: never
				tabLinks: Record<ReviewCardTab, ReactElement>
		  }
	)

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
		marginInlineStart: `calc(${spacing.sm} * -1)`,
	},
	tabs: {
		backgroundColor: semanticColors.surfaceTransparent,
	},
	content: {
		gap: spacing.lg,
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

export function ReviewCardDetail({
	reviewCardId,
	activeTab,
	onTabChange,
	tabLinks,
	onNavigate,
}: ReviewCardDetailProps) {
	const { data: reviewCard } = useSuspenseQuery(
		reviewCardQueries.detail(reviewCardId),
	)
	const today = useToday()
	const srsState = deriveReviewCardSrsState(reviewCard, today)

	return (
		<div {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.toolbar)}>
				<div {...stylex.props(styles.breadcrumbs)}>
					<ReviewCardBreadcrumbs
						primaryText={reviewCard.primaryText}
						topicId={reviewCard.topicId}
						onNavigate={onNavigate}
					/>
				</div>
				<ReviewCardActions reviewCard={reviewCard} />
			</header>
			<Tabs
				value={activeTab}
				onValueChange={value => {
					if (
						onTabChange &&
						(value === 'overview' || value === 'reviews')
					) {
						onTabChange(value)
					}
				}}
				xstyle={styles.tabsContainer}
			>
				<TabsList
					aria-label='Review card sections'
					xstyle={styles.tabs}
				>
					<TabsTrigger
						value='overview'
						nativeButton={tabLinks ? false : undefined}
						render={tabLinks?.overview}
					>
						Overview
					</TabsTrigger>
					<TabsTrigger
						value='reviews'
						nativeButton={tabLinks ? false : undefined}
						render={tabLinks?.reviews}
					>
						Reviews
					</TabsTrigger>
				</TabsList>
			</Tabs>
			<div {...stylex.props(styles.content)}>
				{activeTab === 'overview' ? (
					<ReviewCardOverview reviewCardId={reviewCardId} />
				) : (
					<ReviewCardReviews reviewCardId={reviewCardId} />
				)}
				<ReviewCardSidebar
					{...srsState}
					reviewCardId={reviewCardId}
					today={today}
				/>
			</div>
		</div>
	)
}
