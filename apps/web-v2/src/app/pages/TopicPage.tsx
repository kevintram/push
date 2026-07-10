import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

import { topicQueries } from '~/modules/library/api/queries'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		padding: spacing.xl,
		gap: spacing.md,

		display: 'flex',
		flexDirection: 'column',
	},
	header: {
		gap: spacing.sm,

		display: 'flex',
		flexDirection: 'column',
	},
	title: {
		fontWeight: fontWeights.bold,
	},
	body: {
		fontSize: fontSizes.md,
	},
	reviewCards: {
		display: 'flex',
		flexDirection: 'column',
	},
})

export function TopicPage() {
	const { topicId } = useParams({ from: '/library/$topicId' })
	const { data: topic } = useQuery(topicQueries.detail(Number(topicId)))

	if (!topic) {
		return <div>Topic not found.</div>
	}

	return (
		<div {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.header)}>
				<h1 {...stylex.props(styles.title)}>{topic.title}</h1>
				<p {...stylex.props(styles.body)}>{topic.body}</p>
			</header>

			<h2>Review Cards</h2>

			<div {...stylex.props(styles.reviewCards)}>
				{topic.reviewCards?.map(reviewCard => (
					<ReviewCard
						key={reviewCard.id}
						primary_text={reviewCard.primary_text}
						secondary_text={reviewCard.secondary_text}
					/>
				))}
			</div>
		</div>
	)
}
