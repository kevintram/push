import * as stylex from '@stylexjs/stylex'
import { ChevronsUpDown } from 'lucide-react'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { textFade } from '~/styles/textFade'
import { textFadeVars } from '~/styles/textFade.stylex'
import {
	buttonSizes,
	fontSizes,
	fontWeights,
	iconSizes,
	iconWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

// The pill enters from the bottom edge it sits on.
const enter = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(4px) scale(0.96)' },
	to: { opacity: 1, transform: 'none' },
})

const styles = stylex.create({
	pill: {
		borderRadius: radii.full,
		borderWidth: 0,
		gap: spacing.xs,
		paddingBlock: spacing.none,
		// The title carries the end padding and fades its overflow into it.
		paddingInlineEnd: spacing.none,
		paddingInlineStart: spacing.sm,
		[textFadeVars.size]: spacing.md,

		alignItems: 'center',
		blockSize: buttonSizes.tiny,
		display: 'flex',
		inlineSize: 'fit-content',
		insetBlockEnd: spacing.sm,
		insetInlineEnd: 0,
		insetInlineStart: 0,
		marginInlineEnd: 'auto',
		marginInlineStart: 'auto',
		maxInlineSize: `calc(100% - 2 * ${spacing.lg})`,
		position: 'absolute',

		backgroundColor: colorsSemantic.surfaceInverse,
		boxShadow: `0 4px 12px ${colorsSemantic.shadowPrimary}`,
		color: colorsSemantic.textOnInverse,
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,

		animationDuration: '200ms',
		animationName: {
			default: enter,
			'@media (prefers-reduced-motion: reduce)': 'none',
		},
		animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
		cursor: 'pointer',
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
			default: '125ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'transform',
		transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
		userSelect: 'none',
	},
	icon: {
		color: colorsSemantic.textOnInverseSecondary,
		flexShrink: 0,
	},
})

type RevealSelectionPillProps = {
	title: string
	onClick: () => void
}

/**
 * Names the selected collection while a collapsed branch hides it in the
 * collection tree and reveals it when clicked. It floats over the bottom edge
 * of its positioned container.
 */
export function RevealSelectionPill({
	title,
	onClick,
}: RevealSelectionPillProps) {
	return (
		<button
			type='button'
			aria-label={`Show ${title} in Collections`}
			onClick={onClick}
			{...stylex.props(styles.pill)}
		>
			{/* Mirrors the Collapse all button's ChevronsDownUp. */}
			<ChevronsUpDown
				aria-hidden='true'
				size={iconSizes.sm}
				strokeWidth={iconWeights.medium}
				{...stylex.props(styles.icon)}
			/>
			<span {...stylex.props(textFade.line)}>{title}</span>
		</button>
	)
}
