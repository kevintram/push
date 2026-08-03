import * as stylex from '@stylexjs/stylex'
import { Plus } from 'lucide-react'

import { Button } from '~/components/ui'
import { Review, type ReviewModel } from '~/modules/reviews'
import { layout, spacing } from '~/styles/tokens.stylex'

const ratings: Array<ReviewModel['rating']> = ['miss', 'hard', 'good', 'easy']
const reviews = Array.from({ length: 16 }, (_, index): ReviewModel => {
	const number = index + 1
	const stabilityBefore = 3 + (index % 5)

	return {
		id: `generics-review-${number}`,
		review_card_id: 'typescript-generics',
		rating: ratings[index % ratings.length] ?? null,
		description:
			index === 0
				? 'Correctly described generics.'
				: `Mock review ${number} for vertical overflow testing.`,
		notes:
			index % 3 === 0 ? `Detailed notes for mock review ${number}.` : '',
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
		stability_before: stabilityBefore,
		difficulty_before: 5,
		state_before: 'REVIEW',
		step_before: null,
		due_before: '2026-07-28',
		stability_after: stabilityBefore + ((index % 3) - 1),
		difficulty_after: 4,
		state_after: 'REVIEW',
		step_after: null,
		due_after: '2026-07-30',
	}
})

const styles = stylex.create({
	container: {
		overflow: 'auto',
		display: 'flex',
		justifyContent: 'center',
	},
	content: {
		gap: spacing.xl,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		maxWidth: layout.contentMaxWidth,
		minWidth: 0,
		width: '100%',
	},
	actions: { display: 'flex', justifyContent: 'flex-end' },
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})

export function ReviewCardPageReviews() {
	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
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
			</div>
		</div>
	)
}
