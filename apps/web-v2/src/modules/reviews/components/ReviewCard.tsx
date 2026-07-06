import * as stylex from '@stylexjs/stylex'

import { colors, fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		paddingBlock: spacing.md,

		borderBottomWidth: '1px',
		borderBottomColor: colors.border,
		borderBottomStyle: 'solid',
	},
	title: {
		fontSize: fontSizes.md,
		fontWeight: fontWeights.semibold,
	},
	description: {
		fontSize: fontSizes.sm,
	},
})

type ReviewCardProps = {
	title: string
	description?: string
}

export function ReviewCard({ title, description }: ReviewCardProps) {
	return (
		<div {...stylex.props(styles.container)}>
			<p {...stylex.props(styles.title)}>{title}</p>
			{description ? (
				<p {...stylex.props(styles.description)}>{description}</p>
			) : null}
		</div>
	)
}
