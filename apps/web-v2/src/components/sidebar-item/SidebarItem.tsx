import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import { type LucideIcon } from 'lucide-react'

import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

export interface SidebarItemProps extends Omit<
	useRender.ComponentProps<'button'>,
	'children' | 'className' | 'style'
> {
	icon: LucideIcon
	text: string
	ariaLabel?: string
	/**
	 * `fat` stacks the icon above the label for the primary rail, `skinny` puts
	 * them on one line for nested section navs.
	 */
	layout?: 'fat' | 'skinny'
	/**
	 * Marks non-link items as current. Links get `data-status` from TanStack
	 * Router, so they never need to pass this.
	 */
	active?: boolean
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	item: {
		padding: spacing.sm,
		borderWidth: 0,
		gap: spacing.sm,

		alignItems: 'center',
		display: 'flex',

		textDecoration: 'none',
		cursor: 'pointer',
		fontFamily: 'inherit',

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
	fat: {
		borderRadius: radii.xl,
		flexDirection: 'column',
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
		textAlign: 'center',
	},
	skinny: {
		borderRadius: radii.lg,
		fontSize: fontSizes.sm,
	},
	icon: {
		display: 'block',
		flexShrink: 0,
	},
	skinnyIcon: {
		blockSize: iconSizes.md,
		inlineSize: iconSizes.md,
	},
})

export function SidebarItem({
	active,
	ariaLabel,
	icon: Icon,
	layout = 'fat',
	render,
	text,
	xstyle,
	...props
}: SidebarItemProps) {
	return useRender({
		defaultTagName: 'button',
		props: mergeProps<'button'>(
			{
				'aria-label': ariaLabel ?? text,
				type: render ? undefined : 'button',
			},
			stylex.props(
				styles.item,
				layout === 'fat' ? styles.fat : styles.skinny,
				xstyle,
			),
			props,
			{
				children: (
					<>
						<Icon
							size={iconSizes.md}
							{...stylex.props(
								styles.icon,
								layout === 'skinny' && styles.skinnyIcon,
							)}
						/>
						{text}
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
