import * as stylex from '@stylexjs/stylex'
import { Link, type LinkProps } from '@tanstack/react-router'
import { type LucideIcon } from 'lucide-react'
import { type ReactElement } from 'react'

import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { type SidebarLinkFatProps } from './SidebarLink.types'

type SidebarLinkFatImplementationProps = {
	params?: LinkProps['params']
	to: LinkProps['to']
	text?: string
	ariaLabel?: string
	icon: LucideIcon
}

const styles = stylex.create({
	link: {
		textDecoration: 'none',

		padding: spacing.sm,
		borderRadius: radii.xl,
		gap: spacing.sm,
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
		display: 'block',
	},
})

export function SidebarLinkFat<const TOptions>(
	props: SidebarLinkFatProps<TOptions>,
): ReactElement
export function SidebarLinkFat({
	ariaLabel,
	icon: Icon,
	params,
	text,
	to,
}: SidebarLinkFatImplementationProps) {
	return (
		<Link
			params={params}
			to={to}
			aria-label={ariaLabel ?? text}
			{...stylex.props(styles.link)}
		>
			<Icon {...stylex.props(styles.icon)} size={iconSizes.md} />
			{text}
		</Link>
	)
}
