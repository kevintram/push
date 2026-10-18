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
	iconWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

export interface SidebarItemProps extends Omit<
	useRender.ComponentProps<'button'>,
	'children' | 'className' | 'style'
> {
	children?: ReactNode
	icon?: LucideIcon
	ariaLabel?: string
	/** Drops the label and draws a round icon, as in the collapsed rail. */
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
		borderRadius: radii.md,
		borderWidth: 0,
		gap: spacing.sm,
		paddingBlock: spacing.none,
		paddingInline: appSidebar.rowInset,

		alignItems: 'center',
		blockSize: appSidebar.rowHeight,
		display: 'flex',

		textDecoration: 'none',
		cursor: 'pointer',
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		outlineColor: {
			default: sidebarItemColors.focusRingRest,
			':focus-visible': sidebarItemColors.focusRing,
		},
		// Inset to match the library tree's rows, which share the sidebar.
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',

		backgroundColor: {
			'[data-status=active]': sidebarItemColors.backgroundSelected,
			default: sidebarItemColors.background,
			':is([data-status=active]:hover)':
				sidebarItemColors.backgroundSelectedHover,
			':hover': sidebarItemColors.backgroundHover,
			':active': sidebarItemColors.backgroundPressed,
		},
		color: {
			'[data-status=active]': sidebarItemColors.foregroundSelected,
			default: sidebarItemColors.foreground,
			':hover': sidebarItemColors.foregroundHover,
			':active': sidebarItemColors.foregroundPressed,
		},
	},
	// Round with an outset ring, matching SidebarAction beside it in the
	// rail. Relative so badges can sit on the icon's corner.
	iconOnly: {
		borderRadius: radii.full,
		paddingInline: spacing.none,
		aspectRatio: '1 / 1',
		justifyContent: 'center',
		outlineOffset: '2px',
		position: 'relative',
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

// A place to go in the sidebar. Controls that act in place use SidebarAction.
export function SidebarItem({
	active,
	ariaLabel,
	children,
	icon: Icon,
	iconOnly = false,
	render,
	variant = 'ghost',
	xstyle,
	...props
}: SidebarItemProps) {
	const icon = Icon && (
		<Icon
			aria-hidden='true'
			size={appSidebar.iconSize}
			strokeWidth={iconWeights.medium}
			{...stylex.props(styles.sidebarIcon)}
		/>
	)

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
				iconOnly && styles.iconOnly,
				variant === 'secondary' && styles.secondary,
				variant === 'outline' && styles.outline,
				xstyle,
			),
			props,
			{
				children: (
					<>
						{icon}
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
