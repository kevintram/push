import { Button as ButtonPrimitive } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import {
	colors,
	fontSizes,
	fontWeights,
	gray,
	radii,
	red,
	spacing,
} from '~/styles/tokens.stylex'

import { ButtonIcon } from './ButtonIcon'

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
	iconButton: {
		paddingInline: spacing.none,
		aspectRatio: '1 / 1',
	},
	content: {
		alignItems: 'center',
		display: 'inline-flex',
	},
	slot: {
		alignItems: 'center',
		display: 'inline-flex',
		flexShrink: 0,
		justifyContent: 'center',
	},
	disabled: {
		borderColor: {
			default: 'transparent',
			':hover': 'transparent',
			':active': 'transparent',
		},
		backgroundColor: {
			default: gray[400],
			':hover': gray[400],
			':active': gray[400],
		},
		boxShadow: 'none',
		color: gray[900],
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
			default: gray[950],
			':hover': `color-mix(in srgb, ${gray[950]} 90%, transparent)`,
			':active': `color-mix(in srgb, ${gray[950]} 90%, transparent)`,
		},
		color: { [DARK]: gray[50], default: 'white' },
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
			default: gray[200],
			':hover': gray[300],
			':active': gray[400],
		},
		color: gray[950],
	},
	outline: {
		borderColor: {
			default: gray[500],
			':hover': gray[600],
			':active': gray[600],
		},
		backgroundColor: {
			[DARK]: {
				default: gray[50],
				':hover': gray[200],
				':active': gray[300],
			},
			default: 'white',
			':hover': gray[200],
			':active': gray[300],
		},
		color: gray[950],
	},
	ghost: {
		borderColor: 'transparent',
		backgroundColor: {
			default: 'transparent',
			':hover': gray[300],
			':active': gray[400],
		},
		color: gray[950],
	},
})

const dangerVariants = stylex.create({
	primary: {
		borderColor: 'transparent',
		backgroundColor: {
			default: red[700],
			':hover': red[800],
			':active': red[800],
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
			default: red[100],
			':hover': red[200],
			':active': red[300],
		},
		color: red[900],
	},
	outline: {
		borderColor: {
			default: red[400],
			':hover': red[500],
			':active': red[500],
		},
		backgroundColor: {
			default: red[50],
			':hover': red[100],
			':active': red[200],
		},
		color: red[900],
	},
	ghost: {
		borderColor: 'transparent',
		backgroundColor: {
			default: 'transparent',
			':hover': red[100],
			':active': red[200],
		},
		color: red[900],
	},
})

const sizeVariants = stylex.create({
	micro: {
		borderRadius: radii.lg,
		paddingBlock: spacing.none,
		paddingInline: spacing.sm,
		blockSize: '26px',
		fontSize: fontSizes.sm,
	},
	tiny: {
		borderRadius: radii.lg,
		paddingBlock: spacing.none,
		paddingInline: spacing.sm,
		blockSize: '28px',
		fontSize: fontSizes.sm,
	},
	small: {
		borderRadius: radii.lg,
		paddingBlock: spacing.none,
		paddingInline: spacing.sm,
		blockSize: '32px',
		fontSize: '15px',
	},
	medium: {
		borderRadius: radii.lg,
		paddingBlock: spacing.none,
		paddingInline: spacing.md,
		blockSize: '36px',
		fontSize: '15px',
	},
	large: {
		borderRadius: radii.lg,
		paddingBlock: spacing.none,
		paddingInline: spacing.md,
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
	'className' | 'style' | 'prefix' | 'suffix'
> {
	variant?: ButtonVariant
	size?: ButtonSize
	shape?: ButtonShape
	danger?: boolean
	prefix?: React.ReactNode
	suffix?: React.ReactNode
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
	danger = false,
	disabled,
	children,
	ref,
	iconOnly = false,
	prefix,
	suffix,
	xstyle,
	...props
}: ButtonRenderProps) {
	const styleProps = stylex.props(
		styles.base,
		danger ? dangerVariants[variant] : normalVariants[variant],
		sizeVariants[size],
		iconOnly && styles.iconButton,
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
			{prefix && <span {...stylex.props(styles.slot)}>{prefix}</span>}
			{iconOnly ? (
				<span {...stylex.props(styles.slot)}>{children}</span>
			) : (
				<span {...stylex.props(styles.content)}>{children}</span>
			)}
			{suffix && <span {...stylex.props(styles.slot)}>{suffix}</span>}
		</ButtonPrimitive>
	)
}

export function Button(props: ButtonProps) {
	return renderButton(props)
}

Button.Icon = ButtonIcon
