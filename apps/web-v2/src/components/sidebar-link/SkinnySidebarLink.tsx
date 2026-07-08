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
		padding: spacing.sm,
		borderRadius: radii.lg,
		gap: spacing.sm,
		textDecoration: 'none',
		alignItems: 'center',
		backgroundColor: {
			'[data-status=active]': colors.surfaceActive,
			':hover': colors.surfaceActive,
		},
		color: 'inherit',
		display: 'flex',
		fontSize: fontSizes.sm,
	},
	icon: {
		blockSize: iconSizes.sm,
		inlineSize: iconSizes.sm,
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
