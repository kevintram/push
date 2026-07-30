import * as stylex from '@stylexjs/stylex'

import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import type {
	ReviewCard as ReviewCardModel,
	ReviewCardFilters,
} from '~/modules/reviews/types/review.types'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

type ReviewListPageProps = {
	filters: ReviewCardFilters
	title: string
}

function getCards(filters: ReviewCardFilters): Array<ReviewCardModel> {
	const state: {
		flaggedAt: ReviewCardModel['flagged_at']
		freshnessTier: ReviewCardModel['freshness_tier']
		key: string
		lastReviewedAt: ReviewCardModel['last_reviewed_at']
		nextDueAt: ReviewCardModel['next_due_at']
		stability: ReviewCardModel['stability']
	} =
		filters.due === 'late'
			? {
					key: 'late',
					stability: 3,
					lastReviewedAt: '2026-07-21',
					nextDueAt: '2026-07-25',
					freshnessTier: 'Overdue',
					flaggedAt: '2026-07-25',
				}
			: filters.due === 'new'
				? {
						key: 'new',
						stability: null,
						lastReviewedAt: null,
						nextDueAt: null,
						freshnessTier: null,
						flaggedAt: null,
					}
				: {
						key: 'due',
						stability: 8,
						lastReviewedAt: '2026-07-28',
						nextDueAt: '2026-07-29',
						freshnessTier: 'Fresh',
						flaggedAt: null,
					}

	return Array.from({ length: 18 }, (_, index): ReviewCardModel => {
		const number = index + 1

		return {
			id: `${state.key}-review-card-${number}`,
			topic_id: 'learning-typescript',
			type: index % 4 === 3 ? 'practice' : 'flashcard',
			primary_text:
				index === 0
					? 'What problem do generics solve?'
					: `Mock review card ${number}: TypeScript concept`,
			secondary_text:
				index === 0
					? 'They preserve type safety across reusable code.'
					: `This is the answer for mock review card ${number}.`,
			notes: `Overflow test notes for review card ${number}.`,
			stability: state.stability,
			last_reviewed_at: state.lastReviewedAt,
			next_due_at: state.nextDueAt,
			freshness_tier: state.freshnessTier,
			flagged_at: index % 5 === 4 ? '2026-07-25' : state.flaggedAt,
		}
	})
}

const styles = stylex.create({
	content: {
		paddingBlock: spacing.lg,
	},
	title: {
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
		marginBlockEnd: spacing.md,
	},
})

export function ReviewListPage({ filters, title }: ReviewListPageProps) {
	const cards = getCards(filters)

	return (
		<div {...stylex.props(styles.content)}>
			<h2 {...stylex.props(styles.title)}>{title}</h2>
			{cards.map(card => (
				<ReviewCard key={card.id} {...card} />
			))}
		</div>
	)
}
