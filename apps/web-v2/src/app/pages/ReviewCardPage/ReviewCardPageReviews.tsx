import * as stylex from '@stylexjs/stylex'
import { Plus } from 'lucide-react'

import { ContentColumn } from '~/components/ContentColumn'
import { Button } from '~/components/ui'
import { Review } from '~/modules/reviews/components/Review'
import type { Review as ReviewModel } from '~/modules/reviews/types/review.types'
import { spacing } from '~/styles/tokens.stylex'
const reviews: Array<ReviewModel> = [
	{
		id: 'generics-review-1',
		review_card_id: 'typescript-generics',
		rating: 'good',
		description: 'Correctly described generics.',
		notes: 'Review again soon.',
		scheduled_at: null,
		completed_at: '2026-07-28',
		effective_date: '2026-07-28',
		inserted_at: '2026-07-28',
		updated_at: '2026-07-28',
		review_card: {
			id: 'typescript-generics',
			topic_id: 'learning-typescript',
			type: 'flashcard',
			primary_text: 'What problem do generics solve?',
			secondary_text: 'They preserve type safety across reusable code.',
		},
		stability_before: 4,
		difficulty_before: 5,
		state_before: 'REVIEW',
		step_before: null,
		due_before: '2026-07-28',
		stability_after: 8,
		difficulty_after: 4,
		state_after: 'REVIEW',
		step_after: null,
		due_after: '2026-07-30',
	},
]
const styles = stylex.create({
	page: { gap: spacing.xl, display: 'flex', flexDirection: 'column' },
	actions: { display: 'flex', justifyContent: 'flex-end' },
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})
export function ReviewCardPageReviews() {
	return (
		<ContentColumn xstyle={styles.page}>
			<div {...stylex.props(styles.actions)}>
				<Button disabled>
					<Plus aria-hidden='true' />
					Review
				</Button>
			</div>
			<div {...stylex.props(styles.list)}>
				{reviews.map(review => (
					<Review key={review.id} review={review} />
				))}
			</div>
		</ContentColumn>
	)
}
