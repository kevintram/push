import * as stylex from '@stylexjs/stylex'

import { basicRoutePageColors } from '~/styles/colors/components.stylex'
import { fontSizes, fontWeights, layout, spacing } from '~/styles/tokens.stylex'

type BasicRoutePageProps = {
	description: string
	title: string
}

const styles = stylex.create({
	container: {
		display: 'flex',
		justifyContent: 'center',
		minHeight: '100%',
		width: '100%',
	},
	content: {
		gap: spacing.md,
		marginInline: spacing.lg,
		paddingBlock: spacing.xl,

		alignContent: 'start',
		display: 'grid',
		flexShrink: 1,
		maxWidth: layout.contentColumnMaxWidth,
		minHeight: '100%',
		minWidth: 0,
		width: '100%',
	},
	title: {
		margin: 0,

		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
		letterSpacing: 0,
	},
	description: {
		margin: 0,

		color: basicRoutePageColors.descriptionForeground,
		fontSize: fontSizes.md,
		lineHeight: 1.5,
		maxWidth: '52ch',
	},
})

export function BasicRoutePage({ description, title }: BasicRoutePageProps) {
	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<h1 {...stylex.props(styles.title)}>{title}</h1>
				<p {...stylex.props(styles.description)}>{description}</p>
			</div>
		</div>
	)
}
