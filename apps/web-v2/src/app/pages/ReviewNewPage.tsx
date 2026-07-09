import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'

import { reviewCardKeys } from '~/modules/reviews/api/queryKeys'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import { ReviewCardSchema } from '~/modules/reviews/types/review.schemas'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	title: {
		marginBlockEnd: spacing.md,

		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
	},
})

const fetchReviewCards = async () => {
	const url = new URL(import.meta.env.VITE_API_URL + '/review-cards/')
	url.search = new URLSearchParams({ due: 'new' }).toString()

	const response = await fetch(url, { credentials: 'include' })

	if (!response.ok) {
		throw new Error(`Failed to fetch new reviews: ${response.status}`)
	}

	const data = await response.json()
	return v.parse(v.array(ReviewCardSchema), data)
}

export function ReviewNewPage() {
	const { data } = useQuery({
		queryKey: reviewCardKeys.list({ due: 'new' }),
		queryFn: fetchReviewCards,
	})

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
