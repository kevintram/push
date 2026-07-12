import * as stylex from '@stylexjs/stylex'

import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'
import { getTodayAsString } from '~/utils/date'

import type { Review } from '../../types/review.types'
import { groupReviews } from '../../utils/reviewCollections'
import { Review as ReviewComponent } from './Review'

const styles = stylex.create({
	list: { gap: spacing['3xl'], display: 'flex', flexDirection: 'column' },
	section: { display: 'flex', flexDirection: 'column' },
	title: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
		marginBottom: spacing.md,
	},
})

export function ReviewList({ reviews }: { reviews: Array<Review> }) {
	const groups = groupReviews(reviews, getTodayAsString())

	return (
		<div {...stylex.props(styles.list)}>
			{groups.uncompleted.length > 0 ? (
				<section {...stylex.props(styles.section)}>
					{groups.uncompleted.map(review => (
						<ReviewComponent key={review.id} review={review} />
					))}
				</section>
			) : null}
			{groups.overdue.length > 0 ? (
				<section {...stylex.props(styles.section)}>
					<h2 {...stylex.props(styles.title)}>Overdue</h2>
					{groups.overdue.map(review => (
						<ReviewComponent key={review.id} review={review} />
					))}
				</section>
			) : null}
			{groups.today.length > 0 ? (
				<section {...stylex.props(styles.section)}>
					<h2 {...stylex.props(styles.title)}>Today</h2>
					{groups.today.map(review => (
						<ReviewComponent key={review.id} review={review} />
					))}
				</section>
			) : null}
			{groups.upcoming.length > 0 ? (
				<section {...stylex.props(styles.section)}>
					<h2 {...stylex.props(styles.title)}>Upcoming</h2>
					{groups.upcoming.map(review => (
						<ReviewComponent key={review.id} review={review} />
					))}
				</section>
			) : null}
			{groups.completed.length > 0 ? (
				<section {...stylex.props(styles.section)}>
					<h2 {...stylex.props(styles.title)}>Completed</h2>
					{groups.completed.map(review => (
						<ReviewComponent key={review.id} review={review} />
					))}
				</section>
			) : null}
		</div>
	)
}
