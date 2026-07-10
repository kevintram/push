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

export function ReviewNewPage() {
	const { data } = useGetReviewCards({ due: 'new' })

	return (
		<>
			<h2 {...stylex.props(styles.title)}>New</h2>
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
