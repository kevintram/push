import * as stylex from '@stylexjs/stylex'
import { type ReactNode } from 'react'

import { neutral } from '~/styles/colors/colorsPrimitive.stylex'

const DARK = '@media (prefers-color-scheme: dark)'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	section: {
		scrollMarginTop: spacing.xl,
	},
	header: {
		gap: spacing.md,

		alignItems: 'end',
		display: 'flex',
		flexWrap: 'wrap',
		justifyContent: 'space-between',

		paddingBottom: spacing.md,
	},
	title: {
		margin: 0,

		fontSize: fontSizes['2xl'],
		fontWeight: fontWeights.bold,
		letterSpacing: '-0.025em',
		lineHeight: 1,
	},
	meta: {
		color: { [DARK]: neutral.s400, default: neutral.s600 },
		fontSize: fontSizes.sm,
	},
	body: {
		marginTop: spacing.lg,
	},
})

export function SpecimenSection({
	id,
	title,
	meta,
	children,
}: {
	id: string
	title: string
	meta: string
	children: ReactNode
}) {
	return (
		<section id={id} {...stylex.props(styles.section)}>
			<header {...stylex.props(styles.header)}>
				<h2 {...stylex.props(styles.title)}>{title}</h2>
				<span {...stylex.props(styles.meta)}>{meta}</span>
			</header>
			<div {...stylex.props(styles.body)}>{children}</div>
		</section>
	)
}
