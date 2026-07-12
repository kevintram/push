import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Button } from '~/components/ui'
import { reviewQueries } from '~/modules/reviews/api/queries'
import { colors, radii, spacing } from '~/styles/tokens.stylex'

import { Review } from './review/Review'

const styles = stylex.create({
	container: {
		padding: spacing.lg,
		borderRadius: radii.lg,
		backgroundColor: colors.muted,
		inlineSize: '320px',
	},
	header: {
		display: 'flex',
	},
	actions: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'flex',
	},
	primaryText: {
		flexBasis: '0',
		flexGrow: 1,
		flexShrink: 1,
	},
	seeAll: { textDecoration: 'none', color: 'inherit' },
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})

export function ReviewsSidebar() {
	const { reviewCardId, topicId } = useParams({
		from: '/library/$topicId_/$reviewCardId',
	})
	const { data: reviews } = useQuery(
		reviewQueries.list({ reviewCardId, order: 'desc' }),
	)

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.primaryText)}>Reviews</p>

				<div {...stylex.props(styles.actions)}>
					<Link
						to='/library/$topicId/$reviewCardId/review'
						params={{ reviewCardId, topicId }}
						{...stylex.props(styles.seeAll)}
					>
						See all
					</Link>

					<Button variant='ghost'>
						<Plus />
					</Button>
				</div>
			</div>
			<div {...stylex.props(styles.list)}>
				{reviews?.map(review => (
					<Review key={review.id} review={review} />
				))}
			</div>
		</div>
	)
}
