import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { type SidebarLinkFatProps } from './SidebarLink.types'

const styles = stylex.create({
	link: {
		textDecoration: 'none',

		padding: spacing.sm,
		borderRadius: radii.xl,
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'column',
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
		textAlign: 'center',

		backgroundColor: {
			'[data-status=active]': colors.navBgSurfaceActive,
			default: colors.bg,
			':is([data-status=active]:hover)': colors.navBgSurfaceActive,
			':hover': colors.navBgSurfaceHover,
		},
		color: {
			'[data-status=active]': colors.textLinkActive,
			default: colors.textLink,
			':hover': colors.textLinkHover,
		},
	},
	icon: {
		blockSize: iconSizes.sm,
		display: 'block',
		inlineSize: iconSizes.sm,
	},
	iconContainer: {
		padding: spacing.xs,
		marginBlock: spacing.xs,
	},
})

export function SidebarLinkFat({
	ariaLabel,
	icon: Icon,
	params,
	text,
	to,
}: SidebarLinkFatProps) {
	return (
		<Link
			params={params}
			to={to}
			aria-label={ariaLabel ?? text}
			{...stylex.props(styles.link)}
		>
			<div {...stylex.props(styles.iconContainer)}>
				<Icon {...stylex.props(styles.icon)} />
			</div>
			{text}
		</Link>
	)
}
