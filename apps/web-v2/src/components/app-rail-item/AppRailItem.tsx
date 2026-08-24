import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import { type LucideIcon } from 'lucide-react'

import {
	appRailItemColors,
	buttonColors,
} from '~/styles/colors/components.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

export interface AppRailItemProps extends Omit<
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
	/**
	 * `primary` uses the rail item colors, `secondary` mirrors the Button
	 * secondary variant.
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
			'[data-status=active]': appRailItemColors.backgroundSelected,
			default: appRailItemColors.background,
			':is([data-status=active]:hover)':
				appRailItemColors.backgroundSelectedHover,
			':hover': appRailItemColors.backgroundHover,
		},
		color: {
			'[data-status=active]': appRailItemColors.foregroundSelected,
			default: appRailItemColors.foreground,
			':hover': appRailItemColors.foregroundHover,
		},
	},
	fat: {
		padding: spacing.md,
		borderRadius: radii.xl,
		flexDirection: 'column',
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
		textAlign: 'center',
	},
	skinny: {
		padding: spacing.sm,
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

export function AppRailItem({
	active,
	ariaLabel,
	icon: Icon,
	layout = 'fat',
	render,
	text,
	variant = 'ghost',
	xstyle,
	...props
}: AppRailItemProps) {
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
				variant === 'secondary' && styles.secondary,
				variant === 'outline' && styles.outline,
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
		state: { slot: 'app-rail-item', status: active ? 'active' : undefined },
	})
}
