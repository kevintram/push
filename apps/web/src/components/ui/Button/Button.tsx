import { Button as ButtonPrimitive } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	buttonSizes,
	fontSizes,
	fontWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	base: {
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',

		gap: spacing.sm,
		paddingBlock: spacing.none,

		alignItems: 'center',
		display: 'inline-flex',
		justifyContent: 'center',

		fontSize: fontSizes.md,
		fontWeight: fontWeights.regular,
		lineHeight: 1.5,
		whiteSpace: 'nowrap',

		cursor: 'pointer',
		filter: {
			default: 'none',
			':active': 'none',
		},
		// The outline is only the focus ring; each variant sets the visible edge
		// with borderColor.
		outlineColor: {
			default: semanticColors.surfaceTransparent,
			':focus-visible': semanticColors.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transform: {
			default: 'scale(1)',
			':active': 'scale(0.97)',
		},
		transitionDuration: {
			default: '125ms, 125ms, 125ms, 125ms, 389ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty:
			'background-color, border-color, color, filter, transform',
		transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
		userSelect: 'none',
	},
	iconButton: {
		paddingInline: spacing.none,
		aspectRatio: '1 / 1',
	},
	disabled: {
		boxShadow: 'none',
		cursor: 'not-allowed',
		filter: {
			default: 'none',
			':active': 'none',
		},
		transform: {
			default: 'none',
			':active': 'none',
		},
	},
})

const variants = stylex.create({
	primary: {
		borderColor: semanticColors.surfaceTransparent,
		backgroundColor: {
			default: semanticColors.surfaceInteractivePrimary,
			':hover': semanticColors.surfaceInteractivePrimaryHover,
			':active': semanticColors.surfaceInteractivePrimaryActive,
		},
		color: {
			default: semanticColors.textOnBrand,
			':hover': semanticColors.textOnBrand,
			':active': semanticColors.textOnBrand,
		},
	},
	secondary: {
		borderColor: semanticColors.surfaceTransparent,
		backgroundColor: {
			default: semanticColors.surfaceInteractiveSecondary,
			':hover': semanticColors.surfaceInteractiveSecondaryHover,
			':active': semanticColors.surfaceInteractiveSecondaryActive,
		},
		color: {
			default: semanticColors.textInteractive,
			':hover': semanticColors.textInteractiveHover,
			':active': semanticColors.textInteractiveActive,
		},
	},
	outline: {
		borderColor: semanticColors.borderSubtle,
		backgroundColor: {
			default: semanticColors.surfaceInteractiveSecondary,
			':hover': semanticColors.surfaceInteractiveSecondaryHover,
			':active': semanticColors.surfaceInteractiveSecondaryActive,
		},
		color: {
			default: semanticColors.textInteractive,
			':hover': semanticColors.textInteractiveHover,
			':active': semanticColors.textInteractiveActive,
		},
	},
	ghost: {
		borderColor: semanticColors.surfaceTransparent,
		backgroundColor: {
			default: semanticColors.surfaceTransparent,
			':hover': semanticColors.surfaceTransparentHover,
			':active': semanticColors.surfaceTransparentActive,
		},
		color: {
			default: semanticColors.textInteractive,
			':hover': semanticColors.textInteractiveHover,
			':active': semanticColors.textInteractiveActive,
		},
	},
	danger: {
		borderColor: semanticColors.surfaceTransparent,
		backgroundColor: {
			default: semanticColors.surfaceInteractiveDanger,
			':hover': semanticColors.surfaceInteractiveDangerHover,
			':active': semanticColors.surfaceInteractiveDangerActive,
		},
		color: {
			default: semanticColors.textOnDanger,
			':hover': semanticColors.textOnDanger,
			':active': semanticColors.textOnDanger,
		},
	},
})

// Holds each variant's pressed colors while the button is active.
const activeVariants = stylex.create({
	primary: {
		backgroundColor: semanticColors.surfaceInteractivePrimaryActive,
		color: semanticColors.textOnBrand,
	},
	secondary: {
		backgroundColor: semanticColors.surfaceInteractiveSecondaryActive,
		color: semanticColors.textInteractiveActive,
	},
	outline: {
		backgroundColor: semanticColors.surfaceInteractiveSecondaryActive,
		color: semanticColors.textInteractiveActive,
	},
	ghost: {
		backgroundColor: semanticColors.surfaceTransparentActive,
		color: semanticColors.textInteractiveActive,
	},
	danger: {
		backgroundColor: semanticColors.surfaceInteractiveDangerActive,
		color: semanticColors.textOnDanger,
	},
})

const disabledVariants = stylex.create({
	brand: {
		borderColor: {
			default: semanticColors.surfaceTransparent,
			':hover': semanticColors.surfaceTransparent,
			':active': semanticColors.surfaceTransparent,
		},
		backgroundColor: {
			default: semanticColors.surfaceInteractivePrimaryDisabled,
			':hover': semanticColors.surfaceInteractivePrimaryDisabled,
			':active': semanticColors.surfaceInteractivePrimaryDisabled,
		},
		color: semanticColors.textOnBrandDisabled,
	},
	ghost: {
		borderColor: {
			default: semanticColors.surfaceTransparent,
			':hover': semanticColors.surfaceTransparent,
			':active': semanticColors.surfaceTransparent,
		},
		backgroundColor: {
			default: semanticColors.surfaceTransparent,
			':hover': semanticColors.surfaceTransparent,
			':active': semanticColors.surfaceTransparent,
		},
		color: semanticColors.textInteractiveDisabled,
	},
	generic: {
		borderColor: {
			default: semanticColors.borderDisabled,
			':hover': semanticColors.borderDisabled,
			':active': semanticColors.borderDisabled,
		},
		backgroundColor: {
			default: semanticColors.surfaceInteractiveSecondaryDisabled,
			':hover': semanticColors.surfaceInteractiveSecondaryDisabled,
			':active': semanticColors.surfaceInteractiveSecondaryDisabled,
		},
		color: semanticColors.textDisabled,
	},
})

const sizeVariants = stylex.create({
	micro: {
		borderRadius: radii.sm,
		gap: spacing.xs,
		paddingInline: spacing.sm,
		blockSize: buttonSizes.micro,
		fontSize: fontSizes.sm,
	},
	tiny: {
		borderRadius: radii.sm,
		gap: spacing.xs,
		paddingInline: spacing.sm,
		blockSize: buttonSizes.tiny,
		fontSize: fontSizes.sm,
	},
	small: {
		paddingInline: spacing.sm,
		blockSize: buttonSizes.small,
	},
	medium: {
		paddingInline: spacing.md,
		blockSize: buttonSizes.medium,
	},
	large: {
		paddingInline: spacing.md,
		blockSize: buttonSizes.large,
	},
})

const shapeVariants = stylex.create({
	square: {},
	round: { borderRadius: radii.full },
})

type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizeVariants
type ButtonShape = keyof typeof shapeVariants

export interface ButtonProps extends Omit<
	React.ComponentProps<typeof ButtonPrimitive>,
	'className' | 'style' | 'prefix' | 'suffix'
> {
	variant?: ButtonVariant
	size?: ButtonSize
	shape?: ButtonShape
	/** Squares the button off for a lone icon. Give it an `aria-label`. */
	iconOnly?: boolean
	/**
	 * Keeps the pressed look, e.g. for a toggle whose panel is open. Visual
	 * only: pair it with `aria-pressed` or `aria-expanded` as appropriate.
	 */
	active?: boolean
	xstyle?: stylex.StyleXStyles
}

export function Button({
	variant = 'primary',
	size = 'medium',
	shape = 'square',
	disabled,
	children,
	ref,
	iconOnly = false,
	active = false,
	xstyle,
	...props
}: ButtonProps) {
	const styleProps = stylex.props(
		styles.base,
		variants[variant],
		active && activeVariants[variant],
		sizeVariants[size],
		iconOnly && styles.iconButton,
		shapeVariants[shape],
		disabled && styles.disabled,
		disabled &&
			(variant === 'primary'
				? disabledVariants.brand
				: variant === 'ghost'
					? disabledVariants.ghost
					: disabledVariants.generic),
		xstyle,
	)

	return (
		<ButtonPrimitive
			ref={ref}
			disabled={disabled}
			{...styleProps}
			{...props}
		>
			{children}
		</ButtonPrimitive>
	)
}
