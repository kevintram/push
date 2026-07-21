import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { type ReviewCard } from '~/modules/reviews/types/review.types'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		paddingBlock: spacing.lg,

		borderBottomColor: colors.borderSecondary,
		borderBottomStyle: 'solid',
		borderBottomWidth: '1px',

		textDecoration: 'none',
		color: colors.text,
	},
	title: {
		fontSize: fontSizes.md,
		fontWeight: fontWeights.semibold,
	},
	description: {
		fontSize: fontSizes.sm,
	},
})

export function ReviewCard({ id, primary_text, secondary_text }: ReviewCard) {
	return (
		<Link
			to='/review-cards/$reviewCardId'
			params={{ reviewCardId: id }}
			{...stylex.props(styles.container)}
		>
			<p {...stylex.props(styles.title)}>{primary_text}</p>
			{secondary_text ? (
				<p {...stylex.props(styles.description)}>{secondary_text}</p>
			) : null}
		</Link>
	)
}
