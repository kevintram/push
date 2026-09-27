import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import { type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
	buttonColors,
	sidebarItemColors,
} from '~/styles/colors/components.stylex'
import {
	appSidebar,
	fontSizes,
	fontWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { SidebarItemIcon } from './SidebarItemIcon'

export interface SidebarItemProps extends Omit<
	useRender.ComponentProps<'button'>,
	'children' | 'className' | 'style'
> {
	children?: ReactNode
	icon?: LucideIcon
	ariaLabel?: string
	/**
	 * `fat` stacks the icon above the label; `skinny` puts them on one line.
	 * Defaults to `skinny`.
	 */
	layout?: 'fat' | 'skinny'
	iconOnly?: boolean
	/**
	 * Marks non-link items as current. Links get `data-status` from TanStack
	 * Router, so they never need to pass this.
	 */
	active?: boolean
	/**
	 * `ghost` uses sidebar item colors; `secondary` and `outline` mirror the
	 * corresponding Button variants.
	 */
	variant?: 'ghost' | 'secondary' | 'outline'
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	item: {
		borderWidth: 0,
		gap: spacing.xs,

		alignItems: 'center',
		display: 'flex',

		textDecoration: 'none',
		cursor: 'pointer',
		fontFamily: 'inherit',

		backgroundColor: {
			'[data-status=active]': sidebarItemColors.backgroundSelected,
			default: sidebarItemColors.background,
			':is([data-status=active]:hover)':
				sidebarItemColors.backgroundSelectedHover,
			':hover': sidebarItemColors.backgroundHover,
		},
		color: {
			'[data-status=active]': sidebarItemColors.foregroundSelected,
			default: sidebarItemColors.foreground,
			':hover': sidebarItemColors.foregroundHover,
		},
	},
	fat: {
		gap: spacing.xs,
		paddingBlock: spacing.md,
		paddingInline: spacing.sm,

		borderRadius: radii['2xl'],
		flexDirection: 'column',
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
		textAlign: 'center',
	},
	skinny: {
		borderRadius: radii.md,
		gap: spacing.sm,
		paddingBlock: spacing.none,
		blockSize: '36px',
		fontSize: fontSizes.sm,
		paddingInlineEnd: spacing.xs,
		paddingInlineStart: spacing.sm, // so indicators align with SidebarHeaderActions
	},
	iconOnly: {
		paddingInline: spacing.none,
		aspectRatio: '1 / 1',
		justifyContent: 'center',
	},
	slot: {
		alignItems: 'center',
		display: 'inline-flex',
		flexShrink: 0,
		justifyContent: 'center',
	},
	sidebarIcon: {
		display: 'block',
		flexShrink: 0,
	},
	secondary: {
		borderColor: buttonColors.secondaryBorder,
		backgroundColor: {
			default: buttonColors.secondaryBackground,
			':hover': buttonColors.secondaryBackgroundHover,
			':active': buttonColors.secondaryBackgroundPressed,
		},
		color: {
			default: buttonColors.secondaryForeground,
			':hover': buttonColors.secondaryForegroundHover,
			':active': buttonColors.secondaryForegroundPressed,
		},
	},
	outline: {
		borderColor: buttonColors.outlineBorder,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: {
			default: buttonColors.outlineBackground,
			':hover': buttonColors.outlineBackgroundHover,
			':active': buttonColors.outlineBackgroundPressed,
		},
		color: {
			default: buttonColors.outlineForeground,
			':hover': buttonColors.outlineForegroundHover,
			':active': buttonColors.outlineForegroundPressed,
		},
	},
})

export function SidebarItem({
	active,
	ariaLabel,
	children,
	icon: Icon,
	iconOnly = false,
	layout = 'skinny',
	render,
	variant = 'ghost',
	xstyle,
	...props
}: SidebarItemProps) {
	return useRender({
		defaultTagName: 'button',
		props: mergeProps<'button'>(
			{
				'aria-label':
					ariaLabel ??
					(typeof children === 'string' ? children : undefined),
				type: render ? undefined : 'button',
			},
			stylex.props(
				styles.item,
				layout === 'fat' ? styles.fat : styles.skinny,
				iconOnly && styles.iconOnly,
				variant === 'secondary' && styles.secondary,
				variant === 'outline' && styles.outline,
				xstyle,
			),
			props,
			{
				children: iconOnly ? (
					<span {...stylex.props(styles.slot)}>{children}</span>
				) : (
					<>
						{Icon && (
							<Icon
								size={appSidebar.iconSize}
								{...stylex.props(styles.sidebarIcon)}
							/>
						)}
						{children}
					</>
				),
			},
		),
		render,
		// Links get `data-status` from TanStack Router; this mirrors it for
		// buttons so one set of active styles covers both.
		state: { slot: 'sidebar-item', status: active ? 'active' : undefined },
	})
}

SidebarItem.Icon = SidebarItemIcon
