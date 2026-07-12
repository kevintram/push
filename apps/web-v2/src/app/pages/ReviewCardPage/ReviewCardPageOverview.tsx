import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

import { reviewCardQueries } from '~/modules/reviews/api/queries'
import { ReviewsSidebar } from '~/modules/reviews/components/ReviewsSidebar'

const styles = stylex.create({
	container: {
		display: 'flex',
	},
	main: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
})

export function ReviewCardPageOverview() {
	const { reviewCardId } = useParams({
		from: '/library/$topicId_/$reviewCardId',
	})
	const { data: reviewCard } = useQuery(
		reviewCardQueries.detail(reviewCardId),
	)

	return (
		<div {...stylex.props(styles.container)}>
			<main {...stylex.props(styles.main)}>
				<h1>{reviewCard?.primary_text}</h1>
				<p>{reviewCard?.secondary_text}</p>
				<p>{reviewCard?.notes}</p>
			</main>
			<aside>
				<ReviewsSidebar />
			</aside>
		</div>
	)
}
