import { Button as ButtonPrimitive } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import { buttonColors } from '~/styles/colors/components.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { ButtonIcon } from './ButtonIcon'

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
		outlineColor: {
			default: buttonColors.focusRingRest,
			':focus-visible': buttonColors.focusRing,
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
	slot: {
		alignItems: 'center',
		display: 'inline-flex',
		flexShrink: 0,
		justifyContent: 'center',
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
		borderColor: buttonColors.primaryBorder,
		backgroundColor: {
			default: buttonColors.primaryBackground,
			':hover': buttonColors.primaryBackgroundHover,
			':active': buttonColors.primaryBackgroundPressed,
		},
		color: {
			default: buttonColors.primaryForeground,
			':hover': buttonColors.primaryForegroundHover,
			':active': buttonColors.primaryForegroundPressed,
		},
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
	ghost: {
		borderColor: buttonColors.ghostBorder,
		backgroundColor: {
			default: buttonColors.ghostBackground,
			':hover': buttonColors.ghostBackgroundHover,
			':active': buttonColors.ghostBackgroundPressed,
		},
		color: {
			default: buttonColors.ghostForeground,
			':hover': buttonColors.ghostForegroundHover,
			':active': buttonColors.ghostForegroundPressed,
		},
	},
	danger: {
		borderColor: buttonColors.dangerBorder,
		backgroundColor: {
			default: buttonColors.dangerBackground,
			':hover': buttonColors.dangerBackgroundHover,
			':active': buttonColors.dangerBackgroundPressed,
		},
		color: {
			default: buttonColors.dangerForeground,
			':hover': buttonColors.dangerForegroundHover,
			':active': buttonColors.dangerForegroundPressed,
		},
	},
})

const disabledVariants = stylex.create({
	brand: {
		borderColor: {
			default: buttonColors.primaryDisabledBorder,
			':hover': buttonColors.primaryDisabledBorder,
			':active': buttonColors.primaryDisabledBorder,
		},
		backgroundColor: {
			default: buttonColors.primaryDisabledBackground,
			':hover': buttonColors.primaryDisabledBackground,
			':active': buttonColors.primaryDisabledBackground,
		},
		color: buttonColors.primaryDisabledForeground,
	},
	ghost: {
		borderColor: {
			default: buttonColors.ghostDisabledBorder,
			':hover': buttonColors.ghostDisabledBorder,
			':active': buttonColors.ghostDisabledBorder,
		},
		backgroundColor: {
			default: buttonColors.ghostDisabledBackground,
			':hover': buttonColors.ghostDisabledBackground,
			':active': buttonColors.ghostDisabledBackground,
		},
		color: buttonColors.ghostDisabledForeground,
	},
	generic: {
		borderColor: {
			default: buttonColors.disabledBorder,
			':hover': buttonColors.disabledBorder,
			':active': buttonColors.disabledBorder,
		},
		backgroundColor: {
			default: buttonColors.disabledBackground,
			':hover': buttonColors.disabledBackground,
			':active': buttonColors.disabledBackground,
		},
		color: buttonColors.disabledForeground,
	},
})

const sizeVariants = stylex.create({
	micro: {
		borderRadius: radii.sm,
		gap: spacing.xs,
		paddingInline: spacing.sm,
		blockSize: '26px',
		fontSize: fontSizes.sm,
	},
	tiny: {
		borderRadius: radii.sm,
		gap: spacing.xs,
		paddingInline: spacing.sm,
		blockSize: '28px',
		fontSize: fontSizes.sm,
	},
	small: {
		paddingInline: spacing.sm,
		blockSize: '32px',
	},
	medium: {
		paddingInline: spacing.md,
		blockSize: '36px',
	},
	large: {
		paddingInline: spacing.md,
		blockSize: '40px',
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
	iconOnly?: boolean
	xstyle?: stylex.StyleXStyles
}

interface ButtonRenderProps extends ButtonProps {
	iconOnly?: boolean
}

function renderButton({
	variant = 'primary',
	size = 'medium',
	shape = 'square',
	disabled,
	children,
	ref,
	iconOnly = false,
	xstyle,
	...props
}: ButtonRenderProps) {
	const styleProps = stylex.props(
		styles.base,
		variants[variant],
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
			{iconOnly ? (
				<span {...stylex.props(styles.slot)}>{children}</span>
			) : (
				children
			)}
		</ButtonPrimitive>
	)
}

export function Button(props: ButtonProps) {
	return renderButton(props)
}

Button.Icon = ButtonIcon
