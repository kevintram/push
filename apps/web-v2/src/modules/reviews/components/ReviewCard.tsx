import * as stylex from '@stylexjs/stylex'

import { type ReviewCard as ReviewCardData } from '~/modules/reviews/types/review.types'
import { colors, fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		paddingBlock: spacing.lg,

		borderBottomColor: colors.border,
		borderBottomStyle: 'solid',
		borderBottomWidth: '1px',
	},
	title: {
		fontSize: fontSizes.md,
		fontWeight: fontWeights.semibold,
	},
	description: {
		fontSize: fontSizes.sm,
	},
})

type ReviewCardProps = Pick<ReviewCardData, 'primary_text' | 'secondary_text'>

export function ReviewCard({ primary_text, secondary_text }: ReviewCardProps) {
	return (
		<div {...stylex.props(styles.container)}>
			<p {...stylex.props(styles.title)}>{primary_text}</p>
			{secondary_text ? (
				<p {...stylex.props(styles.description)}>{secondary_text}</p>
			) : null}
		</div>
	)
}
