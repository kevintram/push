import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		padding: spacing.lg,
		borderRadius: radii.xl,
		backgroundColor: semanticColors.surfaceSecondary,
	},
	header: {
		alignItems: 'center',
		display: 'flex',
		paddingBlockEnd: spacing.sm,
	},
	title: {
		margin: 0,
		color: semanticColors.textSecondary,
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.medium,
	},
})

type SidebarPanelProps = {
	title: string
	actions?: ReactNode
	children: ReactNode
	xstyle?: stylex.StyleXStyles
}

/**
 * A titled panel in a page's detail sidebar. Callers own layout (flex
 * sizing, scrolling) through `xstyle`.
 */
export function SidebarPanel({
	title,
	actions,
	children,
	xstyle,
}: SidebarPanelProps) {
	return (
		<section aria-label={title} {...stylex.props(styles.container, xstyle)}>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.title)}>{title}</p>
				{actions}
			</div>
			{children}
		</section>
	)
}
