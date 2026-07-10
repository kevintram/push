import * as stylex from '@stylexjs/stylex'

import { useGetReviewCards } from '~/modules/reviews/api/getReviewCards'
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
	const { data } = useGetReviewCards({ due: 'late' })

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
