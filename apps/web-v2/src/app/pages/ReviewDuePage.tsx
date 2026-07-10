import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'

import { reviewCardQueries } from '~/modules/reviews/api/queries'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'
import { getTodayAsString } from '~/utils/date'

const styles = stylex.create({
	title: {
		marginBlockEnd: spacing.md,

		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
	},
})

export function ReviewDuePage() {
	const { data } = useQuery(
		reviewCardQueries.list({ due: getTodayAsString() }),
	)

	return (
		<>
			<h2 {...stylex.props(styles.title)}>Due</h2>
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
