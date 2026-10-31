import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import { type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
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
	/** Drops the label and draws a round icon, as in the collapsed rail. */
	iconOnly?: boolean
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
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		// Inset to match the collection tree's rows, which share the sidebar.
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transitionDuration: {
			default: '125ms, 125ms, 125ms, 389ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'background-color, border-color, color, transform',
		transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',

		backgroundColor: {
			'[data-status=active]': colorsSemantic.surfaceTransparentActive,
			default: colorsSemantic.surfaceTransparent,
			':is([data-status=active]:hover)':
				colorsSemantic.surfaceTransparentActive,
			':hover': colorsSemantic.surfaceTransparentHover,
			':active': colorsSemantic.surfaceTransparentActive,
		},
		color: {
			'[data-status=active]': colorsSemantic.textInteractiveActive,
			default: colorsSemantic.textInteractive,
			':hover': colorsSemantic.textInteractiveHover,
			':active': colorsSemantic.textInteractiveActive,
		},
	},
	// Buttons shrink a little while pressed, like Button. Links don't.
	pressable: {
		transform: {
			default: 'scale(1)',
			':active': 'scale(0.97)',
		},
	},
	// Round with an outset ring. Relative so badges can sit on the icon's
	// corner.
	iconOnly: {
		borderRadius: radii.full,
		paddingInline: spacing.none,
		aspectRatio: '1 / 1',
		justifyContent: 'center',
		outlineOffset: '2px',
		position: 'relative',
	},
	disabled: {
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparent,
			':active': colorsSemantic.surfaceTransparent,
		},
		color: colorsSemantic.textInteractiveDisabled,
		cursor: 'not-allowed',
		transform: 'none',
	},
	sidebarIcon: {
		display: 'block',
		flexShrink: 0,
	},
	secondary: {
		borderColor: colorsSemantic.surfaceTransparent,
		backgroundColor: {
			default: colorsSemantic.surfaceInteractiveSecondary,
			':hover': colorsSemantic.surfaceInteractiveSecondaryHover,
			':active': colorsSemantic.surfaceInteractiveSecondaryActive,
		},
		color: {
			default: colorsSemantic.textInteractive,
			':hover': colorsSemantic.textInteractiveHover,
			':active': colorsSemantic.textInteractiveActive,
		},
	},
	outline: {
		borderColor: colorsSemantic.borderPrimary,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: {
			default: colorsSemantic.surfaceInteractiveSecondary,
			':hover': colorsSemantic.surfaceInteractiveSecondaryHover,
			':active': colorsSemantic.surfaceInteractiveSecondaryActive,
		},
		color: {
			default: colorsSemantic.textInteractive,
			':hover': colorsSemantic.textInteractiveHover,
			':active': colorsSemantic.textInteractiveActive,
		},
	},
})

export function SidebarItem({
	children,
	disabled,
	icon: Icon,
	iconOnly = false,
	ref,
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
					typeof children === 'string' ? children : undefined,
				disabled,
				type: render ? undefined : 'button',
			},
			stylex.props(
				styles.item,
				!render && styles.pressable,
				iconOnly && styles.iconOnly,
				variant === 'secondary' && styles.secondary,
				variant === 'outline' && styles.outline,
				disabled && styles.disabled,
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
		ref,
		render,
	})
}
