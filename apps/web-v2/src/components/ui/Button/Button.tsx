import { Button as ButtonPrimitive } from '@base-ui/react/button'
import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
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
			default: 'transparent',
			':focus-visible': colors.borderFocus,
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

const normalVariants = stylex.create({
	primary: {
		borderColor: 'transparent',
		backgroundColor: {
			default: colors.bgFillBrand,
			':hover': colors.bgFillBrandHover,
			':active': colors.bgFillBrandActive,
		},
		color: {
			default: colors.textBrandOnBgFill,
			':hover': colors.textBrandOnBgFillHover,
			':active': colors.textBrandOnBgFillActive,
		},
	},
	secondary: {
		borderColor: 'transparent',
		backgroundColor: {
			default: colors.bgFillSecondary,
			':hover': colors.bgFillSecondaryHover,
			':active': colors.bgFillSecondaryActive,
		},
		color: {
			default: colors.textInteractive,
			':hover': colors.textInteractiveHover,
			':active': colors.textInteractiveActive,
		},
	},
	outline: {
		borderColor: colors.borderTertiary,
		backgroundColor: {
			default: colors.bgFillTertiary,
			':hover': colors.bgFillTertiaryHover,
			':active': colors.bgFillTertiaryActive,
		},
		color: {
			default: colors.textInteractive,
			':hover': colors.textInteractiveHover,
			':active': colors.textInteractiveActive,
		},
	},
	ghost: {
		borderColor: 'transparent',
		backgroundColor: {
			default: colors.bgSurfaceTransparent,
			':hover': colors.bgFillTransparentHover,
			':active': colors.bgFillTransparentActive,
		},
		color: {
			default: colors.textInteractive,
			':hover': colors.textInteractiveHover,
			':active': colors.textInteractiveActive,
		},
	},
})

const dangerVariants = stylex.create({
	primary: {
		borderColor: 'transparent',
		backgroundColor: {
			default: colors.bgFillDanger,
			':hover': colors.bgFillDangerHover,
			':active': colors.bgFillDangerActive,
		},
		boxShadow: `inset 0 0 0 1px ${colors.insetContrast}`,
		color: colors.textDangerOnBgFill,
	},
	secondary: {
		borderColor: 'transparent',
		backgroundColor: {
			default: colors.bgFillDangerSecondary,
			':hover': colors.bgFillDangerSecondaryHover,
			':active': colors.bgFillDangerSecondaryActive,
		},
		color: {
			default: colors.textDanger,
			':hover': colors.textDangerHover,
			':active': colors.textDangerActive,
		},
	},
	outline: {
		borderColor: {
			default: colors.borderDanger,
			':hover': colors.borderDangerHover,
			':active': colors.borderDangerActive,
		},
		backgroundColor: {
			default: colors.bgFillDangerTertiary,
			':hover': colors.bgFillDangerTertiaryHover,
			':active': colors.bgFillDangerTertiaryActive,
		},
		color: {
			default: colors.textDanger,
			':hover': colors.textDangerHover,
			':active': colors.textDangerActive,
		},
	},
	ghost: {
		borderColor: 'transparent',
		backgroundColor: {
			default: colors.bgSurfaceTransparent,
			':hover': colors.bgFillDangerTransparentHover,
			':active': colors.bgFillDangerTransparentActive,
		},
		color: {
			default: colors.textDanger,
			':hover': colors.textDangerHover,
			':active': colors.textDangerActive,
		},
	},
})

const disabledVariants = stylex.create({
	brand: {
		borderColor: {
			default: 'transparent',
			':hover': 'transparent',
			':active': 'transparent',
		},
		backgroundColor: {
			default: colors.bgFillBrandDisabled,
			':hover': colors.bgFillBrandDisabled,
			':active': colors.bgFillBrandDisabled,
		},
		color: colors.textBrandOnBgFillDisabled,
	},
	generic: {
		borderColor: {
			default: colors.borderDisabled,
			':hover': colors.borderDisabled,
			':active': colors.borderDisabled,
		},
		backgroundColor: {
			default: colors.bgFillDisabled,
			':hover': colors.bgFillDisabled,
			':active': colors.bgFillDisabled,
		},
		color: colors.textDisabled,
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
		disabled &&
			(!danger && variant === 'primary'
				? disabledVariants.brand
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
