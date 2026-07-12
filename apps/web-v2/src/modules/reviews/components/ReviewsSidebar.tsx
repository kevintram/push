import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Button } from '~/components/ui'
import { reviewQueries } from '~/modules/reviews/api/queries'
import {
	colors,
	fontSizes,
	fontWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'
import { getTodayAsString } from '~/utils/date'

import {
	getLatestCompletedReview,
	groupReviews,
} from '../utils/reviewCollections'
import { Review } from './review/Review'

const styles = stylex.create({
	container: {
		padding: spacing.lg,
		borderRadius: radii.lg,
		backgroundColor: colors.muted,
		inlineSize: '320px',
	},
	header: {
		display: 'flex',
	},
	actions: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'flex',
	},
	primaryText: {
		flexBasis: '0',
		flexGrow: 1,
		flexShrink: 1,
	},
	seeAll: { textDecoration: 'none', color: 'inherit' },
	section: { display: 'flex', flexDirection: 'column' },
	title: {
		color: colors.mutedForeground,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.regular,
		marginBottom: spacing.md,
	},
})

export function ReviewsSidebar() {
	const { reviewCardId, topicId } = useParams({
		from: '/library/$topicId_/$reviewCardId',
	})
	const { data: reviews } = useQuery(
		reviewQueries.list({ reviewCardId, order: 'desc' }),
	)
	const groups = groupReviews(reviews ?? [], getTodayAsString())
	const dueReviews = [...groups.overdue, ...groups.today]
	const latestCompletedReview = getLatestCompletedReview(reviews ?? [])

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.primaryText)}>Reviews</p>

				<div {...stylex.props(styles.actions)}>
					<Link
						to='/library/$topicId/$reviewCardId/review'
						params={{ reviewCardId, topicId }}
						{...stylex.props(styles.seeAll)}
					>
						See all
					</Link>

					<Button variant='ghost'>
						<Plus />
					</Button>
				</div>
			</div>
			{/* Due */}
			{dueReviews.length > 0 ? (
				<section {...stylex.props(styles.section)}>
					<h2 {...stylex.props(styles.title)}>Due</h2>
					{dueReviews.map(review => (
						<Review key={review.id} review={review} />
					))}
				</section>
			) : null}
			{/* Unscheduled */}
			{groups.uncompleted.length > 0 ? (
				<section {...stylex.props(styles.section)}>
					<h2 {...stylex.props(styles.title)}>Unscheduled</h2>
					{groups.uncompleted.map(review => (
						<Review key={review.id} review={review} />
					))}
				</section>
			) : null}
			{/* Upcoming */}
			{groups.upcoming.length > 0 ? (
				<section {...stylex.props(styles.section)}>
					<h2 {...stylex.props(styles.title)}>Scheduled</h2>
					{groups.upcoming.map(review => (
						<Review key={review.id} review={review} />
					))}
				</section>
			) : null}
			{/* Last Completed */}
			{latestCompletedReview ? (
				<section {...stylex.props(styles.section)}>
					<h2 {...stylex.props(styles.title)}>Last reviewed</h2>
					<Review review={latestCompletedReview} />
				</section>
			) : null}
		</div>
	)
}
