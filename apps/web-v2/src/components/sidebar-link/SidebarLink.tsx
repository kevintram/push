import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { type LucideIcon } from 'lucide-react'
import {
	type ComponentPropsWithoutRef,
	type ReactElement,
	type ReactNode,
} from 'react'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { type SidebarLinkCommonProps } from './SidebarLink.types'
import { SidebarLinkFat } from './SidebarLinkFat'

type SidebarLinkProps = SidebarLinkCommonProps & {
	children?: ReactNode
	icon?: LucideIcon
} & Omit<ComponentPropsWithoutRef<'a'>, 'aria-label' | 'children'>

type SidebarLinkComponent = ((props: SidebarLinkProps) => ReactElement) & {
	Fat: typeof SidebarLinkFat
}

const styles = stylex.create({
	icon: {
		blockSize: iconSizes.sm,
		inlineSize: iconSizes.sm,
	},
	link: {
		textDecoration: 'none',

		alignItems: 'center',
		color: {
			'[data-status=active]': colors.textLinkActive,
			default: colors.textLink,
			':hover': colors.textLinkHover,
		},
		display: 'flex',
	},
	skinnyLink: {
		padding: spacing.sm,

		borderRadius: radii.lg,
		gap: spacing.sm,

		backgroundColor: {
			'[data-status=active]': colors.navBgSurfaceActive,
			default: colors.bg,
			':is([data-status=active]:hover)': colors.navBgSurfaceActive,
			':hover': colors.navBgSurfaceHover,
		},

		fontSize: fontSizes.sm,
	},
})

export const SidebarLink: SidebarLinkComponent = ({
	ariaLabel,
	children,
	icon: Icon,
	params,
	text,
	to,
	...linkProps
}) => {
	return (
		<Link
			{...linkProps}
			params={params}
			to={to}
			aria-label={ariaLabel ?? text}
			{...stylex.props(styles.link, styles.skinnyLink)}
		>
			{Icon ? <Icon {...stylex.props(styles.icon)} /> : null}
			{children ?? text}
		</Link>
	)
}

SidebarLink.Fat = SidebarLinkFat
