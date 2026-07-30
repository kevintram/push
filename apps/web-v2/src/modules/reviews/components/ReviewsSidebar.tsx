import * as stylex from '@stylexjs/stylex'
import { Link, useParams } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Button } from '~/components/ui'
import type { Review as ReviewModel } from '~/modules/reviews/types/review.types'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { Review } from './Review'
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
	container: {
		padding: spacing.lg,
		borderRadius: radii.xl,
		backgroundColor: colors.bgSurfaceSecondary,
		inlineSize: '320px',
	},
	header: {
		alignItems: 'center',
		display: 'flex',
		paddingBlockEnd: spacing.sm,
	},
	actions: { gap: spacing.sm, alignItems: 'center', display: 'flex' },
	primaryText: { flexBasis: '0', flexGrow: 1, flexShrink: 1 },
	seeAll: {
		textDecoration: 'none',
		color: {
			default: colors.textLink,
			':hover': colors.textLinkHover,
			':active': colors.textLinkActive,
		},
		fontSize: fontSizes.sm,
	},
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})
export function ReviewsSidebar() {
	const { reviewCardId } = useParams({ from: '/review-cards/$reviewCardId' })
	return (
		<aside {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.primaryText)}>Reviews</p>
				<div {...stylex.props(styles.actions)}>
					<Link
						to='/review-cards/$reviewCardId/reviews'
						params={{ reviewCardId }}
						{...stylex.props(styles.seeAll)}
					>
						See all
					</Link>
					<Button.Icon
						aria-label='Add review'
						variant='ghost'
						size='micro'
						disabled
						shape='round'
					>
						<Plus aria-hidden='true' size={iconSizes.md} />
					</Button.Icon>
				</div>
			</div>
			<div {...stylex.props(styles.list)}>
				{reviews.map(review => (
					<Review key={review.id} review={review} />
				))}
			</div>
		</aside>
	)
}
