import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'

import { getReviewCardsParams } from '~/modules/reviews/api/getReviewCards'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	title: {
		marginBlockEnd: spacing.md,

		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
	},
})

export function ReviewLatePage() {
	const { data } = useQuery(getReviewCardsParams({ due: 'late' }))

	return (
		<>
			<h2 {...stylex.props(styles.title)}>Late</h2>
			{data?.map(card => (
				<ReviewCard
					key={card.id}
					primary_text={card.primary_text}
					secondary_text={card.secondary_text}
				/>
			))}
		</>
	)
}
