import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'

import { reviewCardQueries } from '~/modules/reviews/api/queries'
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
	const { data } = useSuspenseQuery(reviewCardQueries.list({ due: 'late' }))

	return (
		<>
			<h2 {...stylex.props(styles.title)}>Late</h2>
			{data.map(card => (
				<ReviewCard key={card.id} {...card} />
			))}
		</>
	)
}
