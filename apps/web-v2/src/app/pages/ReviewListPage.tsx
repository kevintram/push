import * as stylex from '@stylexjs/stylex'

import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

type ReviewListPageProps = {
	title: string
}

const styles = stylex.create({
	content: {
		paddingBlock: spacing.lg,
	},
	title: {
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
		marginBlockEnd: spacing.md,
	},
})

export function ReviewListPage({ title }: ReviewListPageProps) {
	return (
		<div {...stylex.props(styles.content)}>
			<h2 {...stylex.props(styles.title)}>{title}</h2>
		</div>
	)
}
