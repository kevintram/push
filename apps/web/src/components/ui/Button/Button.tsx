import { Button as ButtonPrimitive } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
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
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
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
		borderColor: colorsSemantic.surfaceTransparent,
		backgroundColor: {
			default: colorsSemantic.surfaceInteractivePrimary,
			':hover': colorsSemantic.surfaceInteractivePrimaryHover,
			':active': colorsSemantic.surfaceInteractivePrimaryActive,
		},
		color: {
			default: colorsSemantic.textOnBrand,
			':hover': colorsSemantic.textOnBrand,
			':active': colorsSemantic.textOnBrand,
		},
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
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparentHover,
			':active': colorsSemantic.surfaceTransparentActive,
		},
		color: {
			default: colorsSemantic.textInteractive,
			':hover': colorsSemantic.textInteractiveHover,
			':active': colorsSemantic.textInteractiveActive,
		},
	},
	ghost: {
		borderColor: colorsSemantic.surfaceTransparent,
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparentHover,
			':active': colorsSemantic.surfaceTransparentActive,
		},
		color: {
			default: colorsSemantic.textInteractive,
			':hover': colorsSemantic.textInteractiveHover,
			':active': colorsSemantic.textInteractiveActive,
		},
	},
	danger: {
		borderColor: colorsSemantic.surfaceTransparent,
		backgroundColor: {
			default: colorsSemantic.surfaceInteractiveDanger,
			':hover': colorsSemantic.surfaceInteractiveDangerHover,
			':active': colorsSemantic.surfaceInteractiveDangerActive,
		},
		color: {
			default: colorsSemantic.textOnDanger,
			':hover': colorsSemantic.textOnDanger,
			':active': colorsSemantic.textOnDanger,
		},
	},
})

// Holds each variant's pressed colors while the button is active.
const activeVariants = stylex.create({
	primary: {
		backgroundColor: colorsSemantic.surfaceInteractivePrimaryActive,
		color: colorsSemantic.textOnBrand,
	},
	secondary: {
		backgroundColor: colorsSemantic.surfaceInteractiveSecondaryActive,
		color: colorsSemantic.textInteractiveActive,
	},
	outline: {
		backgroundColor: colorsSemantic.surfaceTransparentActive,
		color: colorsSemantic.textInteractiveActive,
	},
	ghost: {
		backgroundColor: colorsSemantic.surfaceTransparentActive,
		color: colorsSemantic.textInteractiveActive,
	},
	danger: {
		backgroundColor: colorsSemantic.surfaceInteractiveDangerActive,
		color: colorsSemantic.textOnDanger,
	},
})

const disabledVariants = stylex.create({
	brand: {
		borderColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparent,
			':active': colorsSemantic.surfaceTransparent,
		},
		backgroundColor: {
			default: colorsSemantic.surfaceInteractivePrimaryDisabled,
			':hover': colorsSemantic.surfaceInteractivePrimaryDisabled,
			':active': colorsSemantic.surfaceInteractivePrimaryDisabled,
		},
		color: colorsSemantic.textOnBrandDisabled,
	},
	ghost: {
		borderColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparent,
			':active': colorsSemantic.surfaceTransparent,
		},
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparent,
			':active': colorsSemantic.surfaceTransparent,
		},
		color: colorsSemantic.textInteractiveDisabled,
	},
	generic: {
		borderColor: {
			default: colorsSemantic.borderDisabled,
			':hover': colorsSemantic.borderDisabled,
			':active': colorsSemantic.borderDisabled,
		},
		backgroundColor: {
			default: colorsSemantic.surfaceInteractiveSecondaryDisabled,
			':hover': colorsSemantic.surfaceInteractiveSecondaryDisabled,
			':active': colorsSemantic.surfaceInteractiveSecondaryDisabled,
		},
		color: colorsSemantic.textDisabled,
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
