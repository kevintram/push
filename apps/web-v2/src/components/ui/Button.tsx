import { Button as ButtonPrimitive } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import {
	colors,
	fontSizes,
	fontWeights,
	grayScale,
	radii,
	redScale,
	spacing,
} from '~/styles/tokens.stylex'

const DARK = '@media (prefers-color-scheme: dark)'
const RED_PRIMARY_SHADOW =
	'inset 0 0 0 1px color-mix(in srgb, black 15%, transparent)'
const RED_PRIMARY_SHADOW_DARK =
	'inset 0 0 0 1px color-mix(in srgb, white 15%, transparent)'

const styles = stylex.create({
	base: {
		borderStyle: 'solid',
		borderWidth: '1px',

		gap: spacing.sm,

		alignItems: 'center',
		display: 'inline-flex',
		justifyContent: 'center',

		fontWeight: fontWeights.regular,
		lineHeight: 1.5,
		whiteSpace: 'nowrap',

		cursor: 'pointer',
		filter: {
			default: 'none',
			':active': 'none',
		},
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.focusRing,
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
	disabled: {
		borderColor: {
			default: 'transparent',
			':hover': 'transparent',
			':active': 'transparent',
		},
		backgroundColor: {
			default: grayScale.shade400,
			':hover': grayScale.shade400,
			':active': grayScale.shade400,
		},
		boxShadow: 'none',
		color: grayScale.shade900,
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

const normalVariants = stylex.create({
	primary: {
		borderColor: 'transparent',
		backgroundColor: {
			[DARK]: {
				default: 'white',
				':hover': 'color-mix(in srgb, white 90%, transparent)',
				':active': 'color-mix(in srgb, white 90%, transparent)',
			},
			default: grayScale.shade950,
			':hover': `color-mix(in srgb, ${grayScale.shade950} 90%, transparent)`,
			':active': `color-mix(in srgb, ${grayScale.shade950} 90%, transparent)`,
		},
		color: { [DARK]: grayScale.shade50, default: 'white' },
		filter: {
			[DARK]: {
				default: 'none',
				':active': 'brightness(90%)',
			},
			default: 'none',
			':active': 'brightness(115%)',
		},
	},
	secondary: {
		borderColor: 'transparent',
		backgroundColor: {
			default: grayScale.shade200,
			':hover': grayScale.shade300,
			':active': grayScale.shade400,
		},
		color: grayScale.shade950,
	},
	outline: {
		borderColor: {
			default: grayScale.shade500,
			':hover': grayScale.shade600,
			':active': grayScale.shade600,
		},
		backgroundColor: {
			[DARK]: {
				default: grayScale.shade50,
				':hover': grayScale.shade200,
				':active': grayScale.shade300,
			},
			default: 'white',
			':hover': grayScale.shade200,
			':active': grayScale.shade300,
		},
		color: grayScale.shade950,
	},
	ghost: {
		borderColor: 'transparent',
		backgroundColor: {
			default: 'transparent',
			':hover': grayScale.shade300,
			':active': grayScale.shade400,
		},
		color: grayScale.shade950,
	},
})

const dangerVariants = stylex.create({
	primary: {
		borderColor: 'transparent',
		backgroundColor: {
			default: redScale.shade700,
			':hover': redScale.shade800,
			':active': redScale.shade800,
		},
		boxShadow: {
			[DARK]: RED_PRIMARY_SHADOW_DARK,
			default: RED_PRIMARY_SHADOW,
		},
		color: 'white',
		filter: {
			[DARK]: {
				default: 'none',
				':active': 'brightness(110%) contrast(95%)',
			},
			default: 'none',
			':active': 'brightness(95%)',
		},
	},
	secondary: {
		borderColor: 'transparent',
		backgroundColor: {
			default: redScale.shade100,
			':hover': redScale.shade200,
			':active': redScale.shade300,
		},
		color: redScale.shade900,
	},
	outline: {
		borderColor: {
			default: redScale.shade400,
			':hover': redScale.shade500,
			':active': redScale.shade500,
		},
		backgroundColor: {
			default: redScale.shade50,
			':hover': redScale.shade100,
			':active': redScale.shade200,
		},
		color: redScale.shade900,
	},
	ghost: {
		borderColor: 'transparent',
		backgroundColor: {
			default: 'transparent',
			':hover': redScale.shade100,
			':active': redScale.shade200,
		},
		color: redScale.shade900,
	},
})

const sizeVariants = stylex.create({
	micro: {
		borderRadius: radii.lg,
		paddingBlock: spacing.none,
		paddingInline: {
			default: spacing.sm,
			':has(> svg:only-child)': spacing.none,
		},
		aspectRatio: {
			default: 'auto',
			':has(> svg:only-child)': '1 / 1',
		},
		blockSize: '26px',
		fontSize: fontSizes.sm,
	},
	tiny: {
		borderRadius: radii.lg,
		paddingBlock: spacing.none,
		paddingInline: {
			default: spacing.sm,
			':has(> svg:only-child)': spacing.none,
		},
		aspectRatio: {
			default: 'auto',
			':has(> svg:only-child)': '1 / 1',
		},
		blockSize: '28px',
		fontSize: fontSizes.sm,
	},
	small: {
		borderRadius: radii.xl,
		paddingBlock: spacing.none,
		paddingInline: {
			default: spacing.sm,
			':has(> svg:only-child)': spacing.none,
		},
		aspectRatio: {
			default: 'auto',
			':has(> svg:only-child)': '1 / 1',
		},
		blockSize: '32px',
		fontSize: '15px',
	},
	medium: {
		borderRadius: radii.xl,
		paddingBlock: spacing.none,
		paddingInline: {
			default: spacing.md,
			':has(> svg:only-child)': spacing.none,
		},
		aspectRatio: {
			default: 'auto',
			':has(> svg:only-child)': '1 / 1',
		},
		blockSize: '36px',
		fontSize: '15px',
	},
	large: {
		borderRadius: radii.xl,
		paddingBlock: spacing.none,
		paddingInline: {
			default: spacing.md,
			':has(> svg:only-child)': spacing.none,
		},
		aspectRatio: {
			default: 'auto',
			':has(> svg:only-child)': '1 / 1',
		},
		blockSize: '40px',
		fontSize: '15px',
	},
})

const shapeVariants = stylex.create({
	square: {},
	round: { borderRadius: radii.full },
})

type ButtonVariant = keyof typeof normalVariants
type ButtonSize = keyof typeof sizeVariants
type ButtonShape = keyof typeof shapeVariants

export interface ButtonProps extends Omit<
	React.ComponentProps<typeof ButtonPrimitive>,
	'className' | 'style'
> {
	variant?: ButtonVariant
	size?: ButtonSize
	shape?: ButtonShape
	danger?: boolean
	xstyle?: stylex.StyleXStyles
}

export function Button({
	variant = 'primary',
	size = 'medium',
	shape = 'square',
	danger = false,
	disabled,
	children,
	ref,
	xstyle,
	...props
}: ButtonProps) {
	const styleProps = stylex.props(
		styles.base,
		danger ? dangerVariants[variant] : normalVariants[variant],
		sizeVariants[size],
		shapeVariants[shape],
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
