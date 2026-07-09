import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'

import { reviewCardKeys } from '~/modules/reviews/api/queryKeys'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import { ReviewCardSchema } from '~/modules/reviews/types/review.schemas'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'
import { getTodayAsString } from '~/utils/date'

const styles = stylex.create({
	title: {
		marginBlockEnd: spacing.md,

		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
	},
})

const today = getTodayAsString()

const fetchReviews = async () => {
	const url = new URL(import.meta.env.VITE_API_URL + '/review-cards/')
	url.search = new URLSearchParams({
		due: today,
	}).toString()

	const response = await fetch(url, {
		credentials: 'include',
	})

	if (!response.ok) {
		throw new Error(`Failed to fetch due reviews: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(v.array(ReviewCardSchema), data)
}

export function ReviewDuePage() {
	const { data } = useQuery({
		queryKey: reviewCardKeys.list({ due: today }),
		queryFn: fetchReviews,
	})

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
