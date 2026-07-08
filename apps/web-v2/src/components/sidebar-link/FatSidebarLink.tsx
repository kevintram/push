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
		textDecoration: 'none',

		alignItems: 'center',
		color: 'inherit',

		display: 'flex',
		flexDirection: 'column',

		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
		textAlign: 'center',
	},
	iconContainer: {
		padding: spacing.sm,

		borderRadius: radii.lg,
		marginBlock: spacing.xs,

		backgroundColor: {
			[stylex.when.ancestor(':hover')]: colors.surfaceActive,
			[stylex.when.ancestor('[data-status=active]')]:
				colors.surfaceActive,
		},
	},
	icon: {
		blockSize: iconSizes.sm,

		display: 'block',

		inlineSize: iconSizes.sm,
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
