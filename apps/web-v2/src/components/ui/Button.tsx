import { Button as ButtonPrimitive } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import {
	colors,
	fontSizes,
	fontWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

type ButtonVariant =
	| 'default'
	| 'destructive'
	| 'secondary'
	| 'outline'
	| 'ghost'
type ButtonSize = 'sm' | 'default' | 'lg' | 'icon'

export interface ButtonProps extends React.ComponentProps<
	typeof ButtonPrimitive
> {
	variant?: ButtonVariant
	size?: ButtonSize
}

const styles = stylex.create({
	base: {
		borderRadius: radii.md,
		borderStyle: 'solid',
		borderWidth: '1px',

		gap: spacing.sm,

		alignItems: 'center',
		display: 'inline-flex',
		justifyContent: 'center',

		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		whiteSpace: 'nowrap',

		cursor: 'pointer',
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.focusRing,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transitionDuration: '150ms',
		transitionProperty: 'background-color, border-color, color, opacity',
		transitionTimingFunction: 'ease-in-out',
		userSelect: 'none',
	},
	disabled: {
		opacity: 0.5,
		pointerEvents: 'none',
	},

	variantDefault: {
		borderColor: 'transparent',

		backgroundColor: {
			default: colors.primary,
			':hover': colors.primaryHover,
		},
		color: colors.primaryForeground,
	},
	variantDestructive: {
		borderColor: 'transparent',

		backgroundColor: {
			default: colors.destructive,
			':hover': colors.destructive,
		},
		color: colors.destructiveForeground,
	},
	variantSecondary: {
		borderColor: 'transparent',

		backgroundColor: {
			default: colors.secondary,
			':hover': colors.secondaryHover,
		},
		color: colors.secondaryForeground,
	},
	variantOutline: {
		borderColor: colors.border,

		backgroundColor: {
			default: 'transparent',
			':hover': colors.secondary,
		},
		color: colors.foreground,
	},
	variantGhost: {
		borderColor: 'transparent',

		backgroundColor: {
			default: 'transparent',
			':hover': colors.secondary,
		},
		color: colors.foreground,
	},

	sizeDefault: {
		paddingBlock: spacing.sm,
		paddingInline: spacing.lg,

		blockSize: '36px',
	},
	sizeSm: {
		paddingBlock: spacing.xs,
		paddingInline: spacing.md,

		borderRadius: radii.sm,
		blockSize: '32px',
		fontSize: fontSizes.xs,
	},
	sizeLg: {
		paddingBlock: spacing.md,
		paddingInline: spacing.xl,

		borderRadius: radii.lg,
		blockSize: '44px',
		fontSize: fontSizes.md,
	},
	sizeIcon: {
		padding: spacing.none,

		blockSize: '36px',
		inlineSize: '36px',
	},
})

const variantStyles: Record<ButtonVariant, stylex.StyleXStyles> = {
	default: styles.variantDefault,
	destructive: styles.variantDestructive,
	ghost: styles.variantGhost,
	outline: styles.variantOutline,
	secondary: styles.variantSecondary,
}

const sizeStyles: Record<ButtonSize, stylex.StyleXStyles> = {
	default: styles.sizeDefault,
	icon: styles.sizeIcon,
	lg: styles.sizeLg,
	sm: styles.sizeSm,
}

export function Button({
	variant = 'default',
	size = 'default',
	disabled,
	children,
	ref,
	...props
}: ButtonProps) {
	return (
		<ButtonPrimitive
			ref={ref}
			disabled={disabled}
			{...stylex.props(
				styles.base,
				variantStyles[variant],
				sizeStyles[size],
				disabled && styles.disabled,
			)}
			{...props}
		>
			{children}
		</ButtonPrimitive>
	)
}
