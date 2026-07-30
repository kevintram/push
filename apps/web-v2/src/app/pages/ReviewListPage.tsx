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
	if (filters.due === 'late') {
		return [
			{
				id: 'typescript-generics',
				topic_id: 'learning-typescript',
				type: 'flashcard',
				primary_text: 'What problem do generics solve?',
				secondary_text:
					'They preserve type safety across reusable code.',
				notes: '',
				stability: 3,
				last_reviewed_at: '2026-07-21',
				next_due_at: '2026-07-25',
				freshness_tier: 'Overdue',
				flagged_at: '2026-07-25',
			},
		]
	}

	if (filters.due === 'new') {
		return [
			{
				id: 'typescript-generics',
				topic_id: 'learning-typescript',
				type: 'flashcard',
				primary_text: 'What problem do generics solve?',
				secondary_text:
					'They preserve type safety across reusable code.',
				notes: '',
				stability: null,
				last_reviewed_at: null,
				next_due_at: null,
				freshness_tier: null,
				flagged_at: null,
			},
		]
	}

	return [
		{
			id: 'typescript-generics',
			topic_id: 'learning-typescript',
			type: 'flashcard',
			primary_text: 'What problem do generics solve?',
			secondary_text: 'They preserve type safety across reusable code.',
			notes: '',
			stability: 8,
			last_reviewed_at: '2026-07-28',
			next_due_at: '2026-07-29',
			freshness_tier: 'Fresh',
			flagged_at: null,
		},
	]
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
