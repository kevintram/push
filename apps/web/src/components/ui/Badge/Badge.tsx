import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	base: {
		paddingInline: spacing.sm,

		borderRadius: radii.xs,
		borderStyle: 'solid',
		borderWidth: '1px',

		gap: spacing.xs,

		alignItems: 'center',
		display: 'inline-flex',
		justifyContent: 'center',

		blockSize: '20px',
		fontFamily: 'inherit',
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
		inlineSize: 'fit-content',
		lineHeight: 1,
		whiteSpace: 'nowrap',

		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
	interactive: {
		cursor: 'pointer',
		transitionDuration: {
			default: '125ms, 125ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'background-color, color',
		transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
	},
	round: { borderRadius: radii.full },
})

// TODO(4): Badge intentionally has no `primary` variant. Its highest-emphasis
// variant is `solid` (neutral inverse), whereas Button's `primary` is brand
// indigo, so sharing the name would give one word two meanings. Revisit whether
// Button and Badge should share a single variant vocabulary.
//
// See https://devouringdetails.com/system/button — it argues this collision is
// caused by `variant` coupling appearance to color, and splits them into
// `variant` (solid | soft | ghost | outline) plus a separate `color`
// (accent | blue | red | amber | black). Under that split our case becomes
// variant='solid' color='black' for Badge and variant='solid' color='accent'
// for Button, and the name conflict disappears. Our Button already follows that
// reference's `size` scale, `shape`, `render` prop, and 0.97 press transform,
// so adopting the variant/color split is the remaining piece.
const variants = stylex.create({
	solid: {
		borderColor: colorsSemantic.surfaceInverse,
		backgroundColor: colorsSemantic.surfaceInverse,
		color: colorsSemantic.textOnInverse,
	},
	secondary: {
		borderColor: colorsSemantic.surfaceTransparent,
		backgroundColor: colorsSemantic.surfaceInteractiveSecondary,
		color: colorsSemantic.textInteractive,
	},
	outline: {
		borderColor: colorsSemantic.borderSubtle,
		backgroundColor: colorsSemantic.surfaceInteractiveSecondary,
		color: colorsSemantic.textInteractive,
	},
	ghost: {
		borderColor: colorsSemantic.surfaceTransparent,
		backgroundColor: colorsSemantic.surfaceTransparent,
		color: colorsSemantic.textInteractive,
	},
	danger: {
		borderColor: colorsSemantic.surfaceTransparent,
		backgroundColor: colorsSemantic.surfaceInteractiveDanger,
		color: colorsSemantic.textOnDanger,
	},
})

const interactiveVariants = stylex.create({
	solid: {},
	secondary: {
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
	ghost: {
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

export type BadgeVariant = keyof typeof variants
export type BadgeShape = 'square' | 'round'

export interface BadgeProps extends Omit<
	useRender.ComponentProps<'span'>,
	'className' | 'style'
> {
	variant?: BadgeVariant
	shape?: BadgeShape
	interactive?: boolean
	xstyle?: stylex.StyleXStyles
}

export function Badge({
	variant = 'solid',
	shape = 'round',
	interactive = false,
	render,
	xstyle,
	...props
}: BadgeProps) {
	return useRender({
		defaultTagName: 'span',
		props: mergeProps<'span'>(
			stylex.props(
				styles.base,
				variants[variant],
				interactive && styles.interactive,
				interactive && interactiveVariants[variant],
				shape === 'round' && styles.round,
				xstyle,
			),
			props,
		),
		render,
		state: { slot: 'badge' },
	})
}
