import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { type ReviewCard } from '~/modules/reviews/types/review.types'
import { colors, fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		paddingBlock: spacing.lg,

		borderBottomColor: colors.border,
		borderBottomStyle: 'solid',
		borderBottomWidth: '1px',

		textDecoration: 'none',
		color: 'inherit',
	},
	title: {
		fontSize: fontSizes.md,
		fontWeight: fontWeights.semibold,
	},
	description: {
		fontSize: fontSizes.sm,
	},
})

export function ReviewCard({
	id,
	topic_id,
	primary_text,
	secondary_text,
}: ReviewCard) {
	return (
		<Link
			to='/library/$topicId/$reviewCardId'
			params={{ topicId: String(topic_id), reviewCardId: String(id) }}
			{...stylex.props(styles.container)}
		>
			<p {...stylex.props(styles.title)}>{primary_text}</p>
			{secondary_text ? (
				<p {...stylex.props(styles.description)}>{secondary_text}</p>
			) : null}
		</Link>
	)
}
