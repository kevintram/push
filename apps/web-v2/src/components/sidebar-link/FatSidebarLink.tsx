import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import {
	colors,
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { type BaseSidebarLinkProps } from './SidebarLink.types'

const styles = stylex.create({
	container: {
		textAlign: 'center',
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,

		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',

		color: 'inherit',
		textDecoration: 'none',
	},
	iconContainer: {
		padding: spacing.sm,
		marginBlock: spacing.xs,

		borderRadius: radii.lg,

		backgroundColor: {
			[stylex.when.ancestor(':hover')]: colors.surfaceActive,
			[stylex.when.ancestor('[data-status=active]')]:
				colors.surfaceActive,
		},
	},
	icon: {
		inlineSize: iconSizes.sm,
		blockSize: iconSizes.sm,
		display: 'block',
	},
})

export function FatSidebarLink({
	icon: Icon,
	to,
	text,
	ariaLabel,
}: BaseSidebarLinkProps) {
	return (
		<Link
			to={to}
			aria-label={ariaLabel ?? text}
			{...stylex.props(styles.container, stylex.defaultMarker())}
		>
			<div {...stylex.props(styles.iconContainer)}>
				<Icon {...stylex.props(styles.icon)} />
			</div>
			{text}
		</Link>
	)
}
