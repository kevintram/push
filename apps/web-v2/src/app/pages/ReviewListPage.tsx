import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'

import { reviewCardQueries } from '~/modules/reviews/api/queries'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import type { ReviewCardFilters } from '~/modules/reviews/types/review.types'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

type ReviewListPageProps = {
	filters: ReviewCardFilters
	title: string
}

const styles = stylex.create({
	content: {
		paddingBlock: spacing.lg,
	},
	title: {
		marginBlockEnd: spacing.md,

		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
	},
})

export function ReviewListPage({ filters, title }: ReviewListPageProps) {
	const { data } = useSuspenseQuery(reviewCardQueries.list(filters))

	return (
		<div {...stylex.props(styles.content)}>
			<h2 {...stylex.props(styles.title)}>{title}</h2>
			{data.map(card => (
				<ReviewCard key={card.id} {...card} />
			))}
		</div>
	)
}
