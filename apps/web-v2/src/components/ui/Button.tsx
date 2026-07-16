import { Button as ButtonPrimitive } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import {
	colors,
	fontSizes,
	fontWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

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
})

const colorVariants = stylex.create({
	default: {
		borderColor: 'transparent',

		backgroundColor: {
			default: colors.primary,
			':hover': colors.primaryHover,
		},
		color: colors.primaryForeground,
	},
	destructive: {
		borderColor: 'transparent',

		backgroundColor: {
			default: colors.destructive,
			':hover': colors.destructive,
		},
		color: colors.destructiveForeground,
	},
	secondary: {
		borderColor: 'transparent',

		backgroundColor: {
			default: colors.secondary,
			':hover': colors.secondaryHover,
		},
		color: colors.secondaryForeground,
	},
	outline: {
		borderColor: colors.border,

		backgroundColor: {
			default: 'transparent',
			':hover': colors.secondary,
		},
		color: colors.foreground,
	},
	ghost: {
		borderColor: 'transparent',

		backgroundColor: {
			default: 'transparent',
			':hover': colors.secondary,
		},
		color: colors.foreground,
	},
})

const sizeVariants = stylex.create({
	default: {
		paddingBlock: spacing.sm,
		paddingInline: spacing.lg,

		blockSize: '36px',
	},
	sm: {
		paddingBlock: spacing.xs,
		paddingInline: spacing.md,

		borderRadius: radii.sm,
		blockSize: '32px',
		fontSize: fontSizes.xs,
	},
	lg: {
		paddingBlock: spacing.md,
		paddingInline: spacing.xl,

		borderRadius: radii.lg,
		blockSize: '44px',
		fontSize: fontSizes.md,
	},
	icon: {
		padding: spacing.none,

		blockSize: '36px',
		inlineSize: '36px',
	},
})

type ButtonVariant = keyof typeof colorVariants
type ButtonSize = keyof typeof sizeVariants

export interface ButtonProps extends Omit<
	React.ComponentProps<typeof ButtonPrimitive>,
	'className' | 'style'
> {
	variant?: ButtonVariant
	size?: ButtonSize
	xstyle?: stylex.StyleXStyles
}

export function Button({
	variant = 'default',
	size = 'default',
	disabled,
	children,
	ref,
	xstyle,
	...props
}: ButtonProps) {
	const styleProps = stylex.props(
		styles.base,
		colorVariants[variant],
		sizeVariants[size],
		disabled && styles.disabled,
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
