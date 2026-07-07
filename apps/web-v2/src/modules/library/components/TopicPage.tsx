import * as stylex from '@stylexjs/stylex'

import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import type { Topic } from '../types/topic.types'

type TopicPageProps = Topic

const styles = stylex.create({
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.md,

		padding: spacing.xl,
	},
	header: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.sm,
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

export function TopicPage({ title, body, reviewCards }: TopicPageProps) {
	return (
		<div {...stylex.props(styles.container)}>
			<header {...stylex.props(styles.header)}>
				<h1 {...stylex.props(styles.title)}>{title}</h1>
				<p {...stylex.props(styles.body)}>{body}</p>
			</header>

			<h2>Review Cards</h2>

			<div {...stylex.props(styles.reviewCards)}>
				{reviewCards.map(reviewCard => (
					<ReviewCard
						description={reviewCard.description}
						key={reviewCard.id}
						title={reviewCard.title}
					/>
				))}
			</div>
		</div>
	)
}
