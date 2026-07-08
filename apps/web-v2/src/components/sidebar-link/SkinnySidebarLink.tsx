import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import {
	colors,
	fontSizes,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { type BaseSidebarLinkProps } from './SidebarLink.types'

const styles = stylex.create({
	container: {
		display: 'flex',
		gap: spacing.sm,
		alignItems: 'center',

		padding: spacing.sm,

		fontSize: fontSizes.sm,
		textDecoration: 'none',
		color: 'inherit',

		backgroundColor: {
			':hover': colors.surfaceActive,
			'[data-status=active]': colors.surfaceActive,
		},

		borderRadius: radii.lg,
	},
	icon: {
		inlineSize: iconSizes.sm,
		blockSize: iconSizes.sm,
	},
})

export function SkinnySidebarLink({
	icon: Icon,
	to,
	text,
	ariaLabel,
}: BaseSidebarLinkProps) {
	return (
		<Link
			to={to}
			aria-label={ariaLabel ?? text}
			{...stylex.props(styles.container)}
		>
			<Icon {...stylex.props(styles.icon)} />
			{text}
		</Link>
	)
}
