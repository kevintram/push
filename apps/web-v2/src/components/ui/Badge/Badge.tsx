import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { badgeColors } from '~/styles/colors/components.stylex'
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
			default: badgeColors.focusRingRest,
			':focus-visible': badgeColors.focusRing,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
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
		borderColor: badgeColors.solidBorder,
		backgroundColor: badgeColors.solidBackground,
		color: badgeColors.solidForeground,
	},
	secondary: {
		borderColor: badgeColors.secondaryBorder,
		backgroundColor: badgeColors.secondaryBackground,
		color: badgeColors.secondaryForeground,
	},
	outline: {
		borderColor: badgeColors.outlineBorder,
		backgroundColor: badgeColors.outlineBackground,
		color: badgeColors.outlineForeground,
	},
	ghost: {
		borderColor: badgeColors.ghostBorder,
		backgroundColor: badgeColors.ghostBackground,
		color: badgeColors.ghostForeground,
	},
	danger: {
		borderColor: badgeColors.dangerBorder,
		backgroundColor: badgeColors.dangerBackground,
		color: badgeColors.dangerForeground,
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
	xstyle?: stylex.StyleXStyles
}

export function Badge({
	variant = 'solid',
	shape = 'square',
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
				shape === 'round' && styles.round,
				xstyle,
			),
			props,
		),
		render,
		state: { slot: 'badge' },
	})
}
