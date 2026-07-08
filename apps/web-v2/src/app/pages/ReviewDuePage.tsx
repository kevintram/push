import * as stylex from '@stylexjs/stylex'

import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import reviewCards from '~/modules/reviews/mock-data/review-cards.json'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const dueReviewCards = reviewCards.filter(card => card.status === 'due')

const styles = stylex.create({
	title: {
		marginBlockEnd: spacing.md,

		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
	},
})

export function ReviewDuePage() {
	return (
		<>
			<h2 {...stylex.props(styles.title)}>Due</h2>
			{dueReviewCards.map(card => (
				<ReviewCard
					description={card.description}
					key={card.id}
					title={card.title}
				/>
			))}
		</>
	)
}
