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
		stability: 3,
		last_reviewed_at: '2026-07-21',
		next_due_at: '2026-07-25',
		freshness_tier: 'Overdue',
		flagged_at: '2026-07-25',
	},
]
const styles = stylex.create({
	title: {
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
		marginBlockEnd: spacing.md,
	},
})
export function ReviewLatePage() {
	return (
		<>
			<h2 {...stylex.props(styles.title)}>Late</h2>
			{cards.map(card => (
				<ReviewCard key={card.id} {...card} />
			))}
		</>
	)
}
