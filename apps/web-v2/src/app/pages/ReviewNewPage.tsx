import * as stylex from '@stylexjs/stylex'

import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import type { ReviewCard as ReviewCardModel } from '~/modules/reviews/types/review.types'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'
const cards: Array<ReviewCardModel> = [
	{
		id: 'typescript-generics',
		topic_id: 'learning-typescript',
		type: 'flashcard',
		primary_text: 'What problem do generics solve?',
		secondary_text: 'They preserve type safety across reusable code.',
		notes: '',
		stability: null,
		last_reviewed_at: null,
		next_due_at: null,
		freshness_tier: null,
		flagged_at: null,
	},
]
const styles = stylex.create({
	title: {
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
		marginBlockEnd: spacing.md,
	},
})
export function ReviewNewPage() {
	return (
		<>
			<h2 {...stylex.props(styles.title)}>New</h2>
			{cards.map(card => (
				<ReviewCard key={card.id} {...card} />
			))}
		</>
	)
}
